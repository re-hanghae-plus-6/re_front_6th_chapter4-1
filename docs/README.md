# Vanilla JavaScript SSR & SSG 구현 문서

## 📋 목차

- [프로젝트 개요](#프로젝트-개요)
- [SSR 구현](#ssr-구현)
- [SSG 구현](#ssg-구현)
- [아키텍처](#아키텍처)
- [핵심 라이브러리](#핵심-라이브러리)
- [컴포넌트 시스템](#컴포넌트-시스템)
- [상태 관리](#상태-관리)
- [라우팅 시스템](#라우팅-시스템)
- [이벤트 시스템](#이벤트-시스템)
- [빌드 및 배포](#빌드-및-배포)

## 🎯 프로젝트 개요

이 프로젝트는 **순수 Vanilla JavaScript**로 구현된 쇼핑몰 애플리케이션으로, **SSR(Server-Side Rendering)**과 **SSG(Static Site Generation)**을 모두 지원합니다.

### ✨ 주요 특징

- ✅ **프레임워크 없는** 순수 JavaScript 구현
- ✅ **SSR & SSG** 동시 지원
- ✅ **SPA 라우팅** 시스템
- ✅ **Redux 패턴** 상태 관리
- ✅ **컴포넌트 기반** 아키텍처
- ✅ **이벤트 위임** 시스템
- ✅ **무한 스크롤** 구현
- ✅ **로컬 스토리지** 동기화

## 🖥️ SSR 구현

### 1. 서버 구성 (`server.js`)

```javascript
import express from "express";

const app = express();
const port = process.env.PORT || 5173;

const render = () => {
  return `<div>안녕하세요</div>`;
};

app.get("*all", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Vanilla Javascript SSR</title>
</head>
<body>
<div id="app">${render()}</div>
</body>
</html>
  `.trim());
});

app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
```

### 2. 서버 렌더링 엔트리 (`main-server.js`)

```javascript
export const render = async (url, query) => {
  console.log({ url, query });
  return "";
};
```

### 3. SSR 특징

- **Express 서버**를 사용한 서버 사이드 렌더링
- **모든 경로**(`*all`)에 대한 요청 처리
- **HTML 템플릿**에 렌더링된 컨텐츠 삽입
- **서버에서 완성된 HTML** 전송

## 📄 SSG 구현

### 1. 정적 사이트 생성기 (`static-site-generate.js`)

```javascript
import fs from "fs";

const render = () => {
  return `<div>안녕하세요</div>`;
};

async function generateStaticSite() {
  // HTML 템플릿 읽기
  const template = fs.readFileSync("../../dist/vanilla/index.html", "utf-8");

  // 어플리케이션 렌더링하기
  const appHtml = render();

  // 결과 HTML 생성하기
  const result = template.replace("<!--app-html-->", appHtml);
  fs.writeFileSync("../../dist/vanilla/index.html", result);
}

// 실행
generateStaticSite();
```

### 2. SSG 특징

- **빌드 시점**에 정적 HTML 파일 생성
- **템플릿 플레이스홀더** (`<!--app-html-->`) 교체
- **파일 시스템**에 직접 HTML 파일 저장
- **CDN 배포** 최적화

## 🏗️ 아키텍처

### 전체 구조

```
src/
├── main.js              # 클라이언트 엔트리 포인트
├── main-server.js       # 서버 엔트리 포인트
├── render.js           # 렌더링 시스템
├── events.js           # 이벤트 등록
├── constants.js        # 상수 정의
│
├── api/                # API 통신
│   └── productApi.js
│
├── components/         # UI 컴포넌트
│   ├── ProductCard.js
│   ├── ProductList.js
│   ├── SearchBar.js
│   ├── CartModal.js
│   ├── Toast.js
│   └── ...
│
├── pages/             # 페이지 컴포넌트
│   ├── HomePage.js
│   ├── ProductDetailPage.js
│   ├── NotFoundPage.js
│   └── PageWrapper.js
│
├── stores/            # 상태 관리
│   ├── productStore.js
│   ├── cartStore.js
│   ├── uiStore.js
│   └── actionTypes.js
│
├── services/          # 비즈니스 로직
│   ├── productService.js
│   └── cartService.js
│
├── router/            # 라우팅 시스템
│   ├── router.js
│   └── withLifecycle.js
│
├── lib/               # 핵심 라이브러리
│   ├── Router.js
│   ├── createStore.js
│   ├── createObserver.js
│   └── createStorage.js
│
├── utils/             # 유틸리티
│   ├── eventUtils.js
│   ├── domUtils.js
│   └── withBatch.js
│
├── storage/           # 로컬 스토리지
│   └── cartStorage.js
│
└── mocks/             # 목업 데이터
    ├── browser.js
    ├── handlers.js
    └── items.json
```

## 🔧 핵심 라이브러리

### 1. 옵저버 패턴 (`createObserver.js`)

```javascript
export const createObserver = () => {
  const listeners = new Set();
  const subscribe = (fn) => listeners.add(fn);
  const notify = () => listeners.forEach((listener) => listener());

  return { subscribe, notify };
};
```

### 2. 스토어 시스템 (`createStore.js`)

```javascript
export const createStore = (reducer, initialState) => {
  const { subscribe, notify } = createObserver();
  let state = initialState;

  const getState = () => state;

  const dispatch = (action) => {
    const newState = reducer(state, action);
    if (newState !== state) {
      state = newState;
      notify();
    }
  };

  return { getState, dispatch, subscribe };
};
```

### 3. 라우터 시스템 (`Router.js`)

```javascript
export class Router {
  #routes = new Map();
  #route = null;
  #observer = createObserver();

  addRoute(path, handler) {
    // 경로 패턴을 정규식으로 변환
    const paramNames = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1));
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${this.#baseUrl}${regexPath}$`);
    this.#routes.set(path, { regex, paramNames, handler });
  }

  push(url) {
    window.history.pushState(null, "", url);
    this.#route = this.#findRoute(url);
    this.#observer.notify();
  }
}
```

### 4. 스토리지 시스템 (`createStorage.js`)

```javascript
export const createStorage = (key, storage = window.localStorage) => {
  const get = () => {
    try {
      const item = storage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error parsing storage item for key "${key}":`, error);
      return null;
    }
  };

  const set = (value) => {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting storage item for key "${key}":`, error);
    }
  };

  return { get, set, reset: () => storage.removeItem(key) };
};
```

## 🧩 컴포넌트 시스템

### 1. 함수형 컴포넌트

```javascript
// ProductCard 컴포넌트 예시
export function ProductCard(product) {
  const { productId, title, image, lprice, brand } = product;
  const price = Number(lprice);

  return `
    <div class="product-card" data-product-id="${productId}">
      <img src="${image}" alt="${title}">
      <h3>${title}</h3>
      <p>${brand}</p>
      <p>${price.toLocaleString()}원</p>
      <button class="add-to-cart-btn" data-product-id="${productId}">
        장바구니 담기
      </button>
    </div>
  `;
}
```

### 2. 페이지 래퍼 패턴

```javascript
export const PageWrapper = ({ headerLeft, children }) => {
  const cart = cartStore.getState();
  const { cartModal, toast } = uiStore.getState();

  return `
    <div class="min-h-screen bg-gray-50">
      <header>${headerLeft}</header>
      <main>${children}</main>
      ${CartModal({ ...cart, isOpen: cartModal.isOpen })}
      ${Toast(toast)}
    </div>
  `;
};
```

### 3. 라이프사이클 관리

```javascript
export const HomePage = withLifecycle(
  {
    onMount: () => {
      loadProductsAndCategories();
    },
    watches: [
      () => {
        const { search, limit, sort, category1, category2 } = router.query;
        return [search, limit, sort, category1, category2];
      },
      () => loadProducts(true),
    ],
  },
  () => {
    // 컴포넌트 렌더링 로직
    return PageWrapper({ headerLeft, children });
  }
);
```

## 📊 상태 관리

### 1. Redux 패턴 구현

```javascript
// 액션 타입 정의
export const PRODUCT_ACTIONS = {
  SET_PRODUCTS: "products/setProducts",
  ADD_PRODUCTS: "products/addProducts",
  SET_LOADING: "products/setLoading",
  SET_ERROR: "products/setError",
};

// 리듀서 구현
const productReducer = (state, action) => {
  switch (action.type) {
    case PRODUCT_ACTIONS.SET_PRODUCTS:
      return {
        ...state,
        products: action.payload.products,
        totalCount: action.payload.totalCount,
        loading: false,
      };
    default:
      return state;
  }
};

// 스토어 생성
export const productStore = createStore(productReducer, initialState);
```

### 2. 스토어 구조

- **productStore**: 상품 목록, 상세, 카테고리 관리
- **cartStore**: 장바구니 아이템, 선택 상태 관리
- **uiStore**: 모달, 토스트, 로딩 상태 관리

### 3. 로컬 스토리지 동기화

```javascript
export const saveCartToStorage = () => {
  try {
    const state = cartStore.getState();
    cartStorage.set(state);
  } catch (error) {
    console.error("장바구니 저장 실패:", error);
  }
};
```

## 🛣️ 라우팅 시스템

### 1. SPA 라우터 구현

```javascript
// 라우트 등록
router.addRoute("/", HomePage);
router.addRoute("/product/:id/", ProductDetailPage);
router.addRoute(".*", NotFoundPage);

// 네비게이션
router.push("/product/123/");

// 쿼리 파라미터 관리
router.query = { search: "키보드", limit: 20 };
```

### 2. 동적 라우팅

- **파라미터 추출**: `/product/:id/` → `{ id: "123" }`
- **쿼리 스트링**: `?search=키보드&limit=20`
- **히스토리 API**: `pushState`를 사용한 SPA 네비게이션

## ⚡ 이벤트 시스템

### 1. 이벤트 위임 패턴

```javascript
// 전역 이벤트 핸들러 저장소
const eventHandlers = {};

// 이벤트 위임을 통한 핸들러 추가
export const addEvent = (eventType, selector, handler) => {
  if (!eventHandlers[eventType]) {
    eventHandlers[eventType] = {};
  }
  eventHandlers[eventType][selector] = handler;
};

// 사용 예시
addEvent("click", ".add-to-cart-btn", (e) => {
  const productId = e.target.getAttribute("data-product-id");
  addToCart(productId);
});
```

### 2. 배치 렌더링

```javascript
export const withBatch = (fn) => {
  let scheduled = false;

  return (...args) => {
    if (scheduled) return;
    scheduled = true;

    queueMicrotask(() => {
      scheduled = false;
      fn(...args);
    });
  };
};
```

## 🚀 빌드 및 배포

### 1. 빌드 스크립트

```json
{
  "scripts": {
    "dev": "vite --port 5173",
    "dev:ssr": "PORT=5174 node server.js",
    "build:client": "vite build --outDir ./dist/vanilla",
    "build:server": "vite build --outDir ./dist/vanilla-ssr --ssr src/main-server.js",
    "build:ssg": "pnpm run build:client-for-ssg && node static-site-generate.js",
    "build": "pnpm run build:client && pnpm run build:server && pnpm run build:ssg"
  }
}
```

### 2. 배포 방식

- **CSR**: 클라이언트 사이드 렌더링 (`preview:csr`)
- **SSR**: 서버 사이드 렌더링 (`preview:ssr`)
- **SSG**: 정적 사이트 생성 (`preview:ssg`)

### 3. 환경 분리

```javascript
const prod = process.env.NODE_ENV === "production";
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");
```

## 🎯 성능 최적화

### 1. 무한 스크롤

```javascript
// 스크롤 위치 감지
export const isNearBottom = (threshold = 200) => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const windowHeight = window.innerHeight;
  const documentHeight = document.documentElement.scrollHeight;

  return scrollTop + windowHeight >= documentHeight - threshold;
};

// 무한 스크롤 이벤트
addEvent("scroll", window, () => {
  if (isNearBottom() && hasMore && !loading) {
    loadMoreProducts();
  }
});
```

### 2. 이미지 지연 로딩

```html
<img src="${image}" alt="${title}" loading="lazy">
```

### 3. 코드 분할

- **동적 임포트**: MSW 모킹 시스템
- **조건부 로딩**: 테스트 환경 분리

## 📚 추가 문서

- [아키텍처 상세 가이드](./architecture.md)
- [컴포넌트 시스템 가이드](./components.md)
- [상태 관리 가이드](./state-management.md)
- [라우팅 시스템 가이드](./routing.md)
- [빌드 및 배포 가이드](./build-deploy.md)

## 🎉 결론

이 Vanilla JavaScript 프로젝트는 **프레임워크 없이도** 현대적인 웹 애플리케이션의 모든 기능을 구현할 수 있음을 보여줍니다:

- ✅ **SSR/SSG** 동시 지원
- ✅ **컴포넌트 기반** 아키텍처
- ✅ **상태 관리** 시스템
- ✅ **SPA 라우팅**
- ✅ **이벤트 위임**
- ✅ **성능 최적화**

순수 JavaScript의 **가벼움**과 **유연성**을 활용하면서도, React나 Vue.js와 유사한 **개발 경험**을 제공하는 것이 이 프로젝트의 핵심 가치입니다.
