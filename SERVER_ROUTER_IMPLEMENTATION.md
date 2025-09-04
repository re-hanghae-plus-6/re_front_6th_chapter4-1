# ServerRouter 구현 가이드

바닐라 JavaScript 쇼핑몰 애플리케이션에 Server-Side Rendering (SSR)을 위한 ServerRouter를 단계별로 구현한 과정입니다.

## 🎯 구현 목표

- Express 서버에서 동작하는 라우팅 시스템
- 서버에서 데이터 프리페칭 (상품 목록, 상품 상세)
- 클라이언트 하이드레이션을 통한 서버-클라이언트 상태 동기화
- 기존 클라이언트 코드와의 호환성 유지

## 📁 구현된 파일들

```
packages/vanilla/src/
├── api/
│   └── mockApi.js              # 서버 호환 Mock API 함수들
├── router/
│   └── server-router.js        # ServerRouter 클래스 (새로 생성)
├── main-server.js              # SSR 렌더링 로직 (대폭 수정)
└── main.js                     # 클라이언트 하이드레이션 로직 추가
```

## 🔧 단계별 구현 과정

### 1단계: 서버 호환 Mock API 함수 생성

**파일**: `src/api/mockApi.js`

**문제**: 기존 MSW(Mock Service Worker)는 브라우저에서만 동작하여 서버에서 사용 불가

**해결**:

```javascript
// 상품 데이터를 파일에서 직접 로드 (서버 환경)
function loadItems() {
  if (!items) {
    const itemsPath = path.join(__dirname, "../mocks/items.json");
    items = JSON.parse(fs.readFileSync(itemsPath, "utf-8"));
  }
  return items;
}

// MSW 핸들러와 동일한 로직을 서버 함수로 포팅
export async function mockGetProducts(params = {}) {
  const products = loadItems();
  const filteredProducts = filterProducts(products, params);
  // 페이지네이션, 정렬 로직...
  return { products, pagination, filters };
}
```

**핵심 포인트**:

- 동기적 파일 읽기 (`fs.readFileSync`)
- MSW 핸들러와 완전히 동일한 비즈니스 로직
- 3개 함수 제공: `mockGetProducts`, `mockGetProduct`, `mockGetCategories`

### 2단계: ServerRouter 클래스 구현

**파일**: `src/router/server-router.js`

**문제**: 클라이언트 Router는 브라우저 환경(window, history API)에 의존

**해결**:

```javascript
export class ServerRouter {
  addRoute(path, handler) {
    // ":id" → "([^/]+)" 정규식 변환
    const paramNames = [];
    const regexPath = path.replace(/:\w+/g, (match) => {
      paramNames.push(match.slice(1)); // ':id' → 'id'
      return "([^/]+)";
    });

    const regex = new RegExp(`^${this.#baseUrl}${regexPath}$`);
    this.#routes.set(path, { regex, paramNames, handler, path });
  }

  findRoute(url) {
    const urlObj = new URL(url, "http://localhost");
    const pathname = urlObj.pathname;

    for (const [, route] of this.#routes) {
      const match = pathname.match(route.regex);
      if (match) {
        // 파라미터 추출: ["/product/123/", "123"] → {id: "123"}
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        return { ...route, params, query: this.parseQuery(urlObj.search) };
      }
    }
    return null;
  }
}
```

**핵심 포인트**:

- 클라이언트 Router와 동일한 인터페이스
- 정규식 기반 URL 매칭 및 파라미터 추출
- 쿼리스트링 파싱 기능

### 3단계: 라우트별 데이터 프리페칭 로직

**파일**: `src/main-server.js`

**라우트 설정**:

```javascript
import { ServerRouter } from "./router/server-router.js";
import { mockGetProducts, mockGetCategories, mockGetProduct } from "./api/mockApi.js";

const serverRouter = new ServerRouter();

// 홈페이지 라우트
serverRouter.addRoute("/", async (params, query) => {
  // 병렬 데이터 로딩으로 성능 최적화
  const [productsData, categories] = await Promise.all([
    mockGetProducts({ ...query, limit: query.limit || 20 }),
    mockGetCategories(),
  ]);

  return {
    type: "homepage",
    data: {
      products: productsData.products,
      pagination: productsData.pagination,
      filters: productsData.filters,
      categories,
    },
  };
});

// 상품 상세 페이지 라우트
serverRouter.addRoute("/product/:id/", async (params) => {
  const product = await mockGetProduct(params.id);

  if (!product) {
    return { type: "404", data: { message: "Product not found" } };
  }

  return {
    type: "product-detail",
    data: { currentProduct: product },
  };
});
```

**핵심 포인트**:

- `Promise.all`을 사용한 병렬 데이터 로딩
- 타입 기반 응답 구조 (`type`, `data` 필드)
- 404 에러 처리

### 4단계: HTML 렌더링 함수

**렌더링 플로우**:

```javascript
export const render = async (url) => {
  try {
    // 1. 라우트 매칭
    const route = serverRouter.findRoute(url);

    if (!route) {
      // 404 처리
      return {
        html: '<div id="app"><h1>404 - Page Not Found</h1></div>',
        head: "<title>404 - Page Not Found</title>",
        initialData: { message: "Page not found" },
      };
    }

    // 2. 데이터 프리페칭
    const result = await route.handler(route.params, route.query);

    // 3. 타입별 HTML 생성
    let html, title;
    switch (result.type) {
      case "homepage":
        html = `<div id="app">
          <h1>Shopping Mall</h1>
          <p>Products loaded: ${result.data.products.length}</p>
          <p>Total products: ${result.data.pagination.total}</p>
        </div>`;
        title = "Shopping Mall - Home";
        break;

      case "product-detail":
        html = `<div id="app">
          <h1>${result.data.currentProduct.title}</h1>
          <p>Price: ${result.data.currentProduct.lprice}원</p>
          <p>Brand: ${result.data.currentProduct.brand}</p>
        </div>`;
        title = `${result.data.currentProduct.title} - Shopping Mall`;
        break;
    }

    return {
      html,
      head: `<title>${title}</title>`,
      initialData: result.data, // 클라이언트 하이드레이션용
    };
  } catch (error) {
    console.error("Server rendering error:", error);
    return {
      html: '<div id="app"><h1>Server Error</h1></div>',
      head: "<title>Server Error</title>",
      initialData: { error: "Server rendering failed" },
    };
  }
};
```

**핵심 포인트**:

- 3단계 처리: 라우트 매칭 → 데이터 로딩 → HTML 생성
- `initialData`를 통해 클라이언트로 데이터 전달
- 포괄적 에러 처리

### 5단계: 클라이언트 하이드레이션

**파일**: `src/main.js`

```javascript
import { productStore, PRODUCT_ACTIONS } from "./stores";

function hydrateFromInitialData() {
  if (typeof window !== "undefined" && window.__INITIAL_DATA__) {
    try {
      const initialData = window.__INITIAL_DATA__;

      // 홈페이지 데이터 복원
      if (initialData.products && initialData.categories) {
        productStore.dispatch(PRODUCT_ACTIONS.SETUP, {
          products: initialData.products,
          totalCount: initialData.pagination?.total || initialData.products.length,
          categories: initialData.categories,
          loading: false, // 이미 로드된 상태
          error: null,
          status: "done",
        });
      }

      // 상품 상세 페이지 데이터 복원
      if (initialData.currentProduct) {
        productStore.dispatch(PRODUCT_ACTIONS.SET_CURRENT_PRODUCT, initialData.currentProduct);
      }

      // 사용 후 정리
      delete window.__INITIAL_DATA__;
    } catch (error) {
      console.error("Failed to hydrate from initial data:", error);
      if (window.__INITIAL_DATA__) {
        delete window.__INITIAL_DATA__;
      }
    }
  }
}

function main() {
  // 1. 서버 데이터로부터 하이드레이션 (가장 먼저 실행)
  hydrateFromInitialData();

  // 2. 기존 초기화 로직
  registerAllEvents();
  registerGlobalEvents();
  loadCartFromStorage();
  initRender();
  router.start();
}
```

**핵심 포인트**:

- 서버에서 로드한 데이터를 클라이언트 store에 복원
- `loading: false`로 설정해 불필요한 재로딩 방지
- 메모리 누수 방지를 위한 데이터 정리

## 🔄 전체 데이터 플로우

```
1. 사용자가 /product/123/ 요청
     ↓
2. Express server.js에서 render(url) 호출
     ↓
3. ServerRouter가 "/product/:id/" 매칭 → params.id = "123"
     ↓
4. mockGetProduct("123") 호출로 상품 데이터 로드
     ↓
5. HTML + initialData 생성하여 클라이언트로 전송
     ↓
6. 클라이언트에서 window.__INITIAL_DATA__ 읽어서 productStore 복원
     ↓
7. 하이드레이션 완료, 추가 API 호출 없이 즉시 렌더링 가능
```

## ✅ 주요 장점

### 성능 최적화

- **First Paint 시간 단축**: 서버에서 미리 데이터를 로드해 첫 렌더링 속도 향상
- **병렬 데이터 로딩**: `Promise.all`로 여러 API를 동시에 호출
- **불필요한 재요청 방지**: 하이드레이션된 데이터로 즉시 렌더링

### SEO & 접근성

- **검색엔진 최적화**: 완전한 HTML을 서버에서 제공
- **메타 태그**: 페이지별 적절한 `<title>` 설정
- **초기 렌더링**: JavaScript 없이도 콘텐츠 표시 가능

### 코드 품질

- **모듈화**: ServerRouter를 별도 파일로 분리
- **재사용성**: 클라이언트와 서버가 동일한 비즈니스 로직 사용
- **타입 안전성**: JSDoc 주석으로 타입 정보 제공
- **에러 처리**: 포괄적인 에러 핸들링

### 유지보수성

- **점진적 개선**: 기존 클라이언트 코드를 거의 수정하지 않고 SSR 추가
- **일관된 인터페이스**: 클라이언트 Router와 동일한 메서드명 사용
- **디버깅 친화적**: 상세한 로그와 에러 메시지

## 🧪 테스트 방법

```bash
# SSR 개발 서버 실행
pnpm -F @hanghae-plus/shopping-vanilla dev:ssr

# 홈페이지 테스트
curl http://localhost:5174/

# 상품 상세 페이지 테스트
curl http://localhost:5174/product/11124150101/

# 404 페이지 테스트
curl http://localhost:5174/non-existent-page
```

## 🚀 향후 개선 방안

1. **실제 페이지 컴포넌트 사용**: 현재는 간단한 HTML 문자열, 향후 실제 컴포넌트 렌더링
2. **캐싱 전략**: 자주 요청되는 데이터의 메모리 캐싱
3. **스트리밍 SSR**: 큰 페이지의 점진적 렌더링
4. **에러 페이지 개선**: 더 상세하고 사용자 친화적인 에러 페이지

---

_구현 일자: 2025-09-02_  
_구현자: Claude Code Assistant_
