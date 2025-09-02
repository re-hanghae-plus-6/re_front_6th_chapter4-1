# E2E 테스트 문제 해결 로그

## 📋 개요
Vanilla JavaScript 프로젝트의 E2E 테스트 실패 문제를 해결하는 과정에서 발생한 모든 에러와 해결책을 기록합니다.

## 🚨 초기 문제 상황
- **문제**: `pnpm test:e2e:basic` 실행 시 다수의 테스트 실패
- **영향 범위**: CSR, SSR, SSG 모든 렌더링 모드에서 문제 발생
- **주요 증상**: Playwright 테스트 타임아웃, 요소 선택자 찾기 실패

## 🔍 문제 분석 및 해결 과정

### 1. Playwright 선택자 문제

#### 🚨 에러:
```
TimeoutError: Locator.click: Timeout 30000ms exceeded.
=========================== logs ===========================
waiting for locator('#sort-select')
```

#### 🔍 원인:
- `SearchBar.js`에서 정렬 선택박스와 개수 선택박스에 `id` 속성이 누락됨
- Playwright 테스트에서 `#sort-select`, `#limit-select` 선택자로 요소를 찾으려 했으나 해당 ID가 존재하지 않음

#### ✅ 해결책:
```javascript
// packages/vanilla/src/components/SearchBar.js
// 수정 전
<select data-action="limit" class="...">

// 수정 후  
<select id="limit-select" data-action="limit" class="...">

// 수정 전
<select data-action="sort" class="...">

// 수정 후
<select id="sort-select" data-action="sort" class="...">
```

### 2. SSR 프로덕션 빌드 경로 문제

#### 🚨 에러:
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module '/Users/.../packages/vanilla/dist/server/main-server.js'
```

#### 🔍 원인:
- `server.js`에서 프로덕션 환경의 SSR 모듈 경로가 잘못됨
- 실제 빌드 경로: `./dist/vanilla-ssr/main-server.js`
- 코드의 경로: `./dist/server/main-server.js`

#### ✅ 해결책:
```javascript
// packages/vanilla/server.js
// 수정 전
render = (await import("./dist/server/main-server.js")).render;

// 수정 후
render = (await import("./dist/vanilla-ssr/main-server.js")).render;
```

### 3. SSR 데이터 및 메타태그 문제

#### 🚨 에러:
- `window.__INITIAL_DATA__`가 올바르게 설정되지 않음
- 페이지별 동적 메타태그 누락 (SEO 문제)

#### 🔍 원인:
- `main-server.js`에서 정적인 렌더링만 수행
- 상품 상세 페이지와 홈페이지 구분 없이 동일한 데이터 반환
- 페이지 제목이 동적으로 변경되지 않음

#### ✅ 해결책:
```javascript
// packages/vanilla/src/main-server.js
export const render = async (url, query) => {
  const productMatch = url.match(/^\/product\/(\d+)\/?$/);
  const isProductDetail = !!productMatch;
  const productId = productMatch?.[1];

  let pageTitle = "쇼핑몰 - 홈";
  let initialData = {};

  if (isProductDetail && productId) {
    // 상품 상세 페이지
    const product = await getProduct(productId);
    pageTitle = `${product.title} - 쇼핑몰`;
    initialData = { product };
  } else {
    // 홈페이지
    const [{ products, pagination: { total } }, categories] = 
      await Promise.all([getProducts(query), getCategories()]);
    
    initialData = {
      products,
      categories,
      totalCount: total,
    };
  }

  return {
    head: `<title>${pageTitle}</title>`,
    html: HomePage(url, query, {
      ...initialData,
      loading: false,
      status: "done",
    }),
  };
};
```

### 4. SSG 빌드 실패 - API 호출 문제

#### 🚨 에러:
```
TypeError: fetch failed
    at fetch (node:internal/deps/undici/undici:12618:11)
    cause: Error: connect ECONNREFUSED 127.0.0.1:3000
```

#### 🔍 원인:
- SSG 빌드 시 `getProducts()`, `getCategories()` API 호출 실행
- Node.js 환경에서 MSW 서버가 실행되지 않아 실제 HTTP 요청 발생
- 로컬 서버(포트 3000)가 실행되지 않아 연결 실패

#### ✅ 해결책 (1차 시도 - 실패):
하드코딩된 목 데이터 사용 → 사용자가 올바른 접근법이 아니라고 피드백

#### ✅ 해결책 (최종):
MSW와 Vite 서버를 SSG 스크립트에 통합:

```javascript
// packages/vanilla/static-site-generate.js
import fs from "fs";
import { server } from "./src/mocks/serverBrowser.js";
import { createServer } from "vite";

async function generateStaticSite() {
  let vite;

  try {
    // MSW 서버 시작
    await server.listen({ onUnhandledRequest: "bypass" });
    console.log("MSW 서버 시작 완료");

    // Vite 서버 생성 (개발 모드와 동일)
    vite = await createServer({
      server: { middlewareMode: true },
      appType: "custom",
    });

    // Vite를 통해 SSR 모듈 로드
    const { render } = await vite.ssrLoadModule("/src/main-server.js");

    // 나머지 렌더링 로직...
  } finally {
    // 서버들 정리
    if (vite) await vite.close();
    await server.close();
  }
}
```

### 5. Node.js ES 모듈 임포트 문제

#### 🚨 에러:
```
Error [ERR_UNSUPPORTED_DIR_IMPORT]: Directory import './pages' is not supported resolving ES modules
Error [ERR_UNSUPPORTED_DIR_IMPORT]: Directory import './components' is not supported resolving ES modules
Error [ERR_UNSUPPORTED_DIR_IMPORT]: Directory import './stores' is not supported resolving ES modules
```

#### 🔍 원인:
- Node.js ES 모듈에서는 디렉토리 임포트 시 명시적인 파일 경로 필요
- `import { HomePage } from "./pages"` → `import { HomePage } from "./pages/index.js"` 필요
- 여러 `index.js` 파일에서 `.js` 확장자 누락

#### ✅ 해결책:
모든 관련 `index.js` 파일의 export 경로에 `.js` 확장자 추가:

```javascript
// 수정 전
export * from "./HomePage";
export * from "./ProductDetailPage";

// 수정 후
export * from "./HomePage.js";
export * from "./ProductDetailPage.js";
```

**수정된 파일들:**
- `src/pages/index.js`
- `src/components/index.js`
- `src/stores/index.js`
- `src/lib/index.js`
- `src/utils/index.js`
- `src/services/index.js`
- `src/router/index.js`
- `src/storage/index.js`

그리고 직접 임포트하는 파일들도 수정:
- `src/pages/HomePage.js`
- `src/render.js`
- `src/components/ProductList.js`
- `src/components/CartModal.js`
- `src/pages/NotFoundPage.js`
- `src/lib/createStore.js`

## 🧪 테스트 구조 이해

### E2E 테스트 시나리오:
1. **CSR (Client-Side Rendering)**:
   - 포트 5173 (개발 서버)
   - 포트 4173 (프리뷰 서버)

2. **SSR (Server-Side Rendering)**:
   - 포트 5174 (개발 SSR 서버)
   - 포트 4174 (프리뷰 SSR 서버)

3. **SSG (Static Site Generation)**:
   - 포트 4178 (정적 파일 서버)

### 주요 테스트 선택자:
- `#sort-select`: 정렬 선택박스
- `#limit-select`: 개수 제한 선택박스
- `.product-item`: 상품 카드
- `[data-product-id]`: 상품별 식별자

## 🎯 핵심 학습 사항

1. **Playwright 테스트**: 정확한 선택자 매칭이 중요
2. **Node.js ES 모듈**: 명시적 파일 확장자 필요
3. **SSG 구현**: MSW + Vite 조합으로 개발 환경과 동일한 조건 구성
4. **빌드 경로**: 프로덕션 빌드 시 정확한 경로 매핑 중요
5. **SSR 데이터 주입**: `window.__INITIAL_DATA__`를 통한 클라이언트 하이드레이션

## 🚀 최종 상태
모든 주요 문제가 해결되었으며, 다음 명령어로 테스트 가능:
```bash
# SSG 빌드
pnpm run build:ssg

# E2E 테스트 실행
pnpm test:e2e:basic
```

## 📝 추가 참고사항
- MSW (Mock Service Worker)를 통한 API 모킹이 모든 렌더링 모드에서 일관되게 작동
- Vite의 `ssrLoadModule`을 활용하여 개발 환경과 동일한 모듈 로딩 방식 구현
- `try-catch-finally` 패턴으로 안전한 리소스 정리 보장
