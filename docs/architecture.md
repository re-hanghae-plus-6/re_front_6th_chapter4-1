# 아키텍처 상세 가이드

## 📋 목차

- [전체 아키텍처 개요](#전체-아키텍처-개요)
- [레이어별 구조](#레이어별-구조)
- [데이터 플로우](#데이터-플로우)
- [모듈 의존성](#모듈-의존성)
- [디자인 패턴](#디자인-패턴)
- [성능 고려사항](#성능-고려사항)

## 🏗️ 전체 아키텍처 개요

### 아키텍처 다이어그램

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                       │
├─────────────────────────────────────────────────────────────┤
│  Pages (HomePage, ProductDetailPage, NotFoundPage)         │
│  Components (ProductCard, SearchBar, CartModal, Toast)     │
│  PageWrapper (공통 레이아웃)                                │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Business Logic Layer                     │
├─────────────────────────────────────────────────────────────┤
│  Services (productService, cartService)                    │
│  API Layer (productApi)                                     │
│  Router (라우팅 로직)                                       │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                     State Management                        │
├─────────────────────────────────────────────────────────────┤
│  Stores (productStore, cartStore, uiStore)                 │
│  Redux Pattern (Actions, Reducers)                         │
│  Local Storage (cartStorage)                               │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                      Core Libraries                         │
├─────────────────────────────────────────────────────────────┤
│  createStore, createObserver, Router, createStorage        │
│  Event System (이벤트 위임)                                 │
│  Utils (DOM 조작, 배치 처리)                               │
└─────────────────────────────────────────────────────────────┘
```

### 핵심 설계 원칙

1. **관심사 분리**: 각 레이어는 명확한 책임을 가짐
2. **단방향 데이터 플로우**: 데이터는 위에서 아래로 흐름
3. **컴포지션**: 작은 단위의 함수들을 조합하여 복잡한 기능 구현
4. **불변성**: 상태 변경 시 새로운 객체 생성
5. **이벤트 기반**: 느슨한 결합을 위한 이벤트 시스템

## 📁 레이어별 구조

### 1. Presentation Layer (표현 계층)

#### Pages
```javascript
// 페이지 컴포넌트 구조
export const HomePage = withLifecycle(
  {
    onMount: () => loadProductsAndCategories(),
    watches: [() => [router.query], () => loadProducts(true)]
  },
  () => {
    const state = productStore.getState();
    return PageWrapper({
      headerLeft: `<h1>쇼핑몰</h1>`,
      children: `${SearchBar()} ${ProductList()}`
    });
  }
);
```

#### Components
```javascript
// 재사용 가능한 UI 컴포넌트
export function ProductCard(product) {
  return `
    <div class="product-card" data-product-id="${product.productId}">
      <img src="${product.image}" alt="${product.title}">
      <h3>${product.title}</h3>
      <p>${product.brand}</p>
      <p>${Number(product.lprice).toLocaleString()}원</p>
      <button class="add-to-cart-btn">장바구니 담기</button>
    </div>
  `;
}
```

#### PageWrapper
```javascript
// 공통 레이아웃 컴포넌트
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

### 2. Business Logic Layer (비즈니스 로직 계층)

#### Services
```javascript
// 상품 관련 비즈니스 로직
export const loadProducts = async (resetList = true) => {
  try {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: { loading: true, status: "pending", error: null }
    });

    const { products, pagination: { total } } = await getProducts(router.query);
    
    if (resetList) {
      productStore.dispatch({ 
        type: PRODUCT_ACTIONS.SET_PRODUCTS, 
        payload: { products, totalCount: total } 
      });
    } else {
      productStore.dispatch({ 
        type: PRODUCT_ACTIONS.ADD_PRODUCTS, 
        payload: { products, totalCount: total } 
      });
    }
  } catch (error) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_ERROR,
      payload: error.message
    });
  }
};
```

#### API Layer
```javascript
// API 통신 추상화
export async function getProducts(params = {}) {
  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
  const page = params.current ?? params.page ?? 1;

  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(category1 && { category1 }),
    ...(category2 && { category2 }),
    sort,
  });

  const response = await fetch(`/api/products?${searchParams}`);
  return await response.json();
}
```

### 3. State Management (상태 관리 계층)

#### Store 구조
```javascript
// Redux 패턴 구현
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

#### Reducer 패턴
```javascript
// 상품 스토어 리듀서
const productReducer = (state, action) => {
  switch (action.type) {
    case PRODUCT_ACTIONS.SET_PRODUCTS:
      return {
        ...state,
        products: action.payload.products,
        totalCount: action.payload.totalCount,
        loading: false,
        error: null,
        status: "done"
      };
    case PRODUCT_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case PRODUCT_ACTIONS.SET_ERROR:
      return {
        ...state,
        error: action.payload,
        loading: false,
        status: "done"
      };
    default:
      return state;
  }
};
```

### 4. Core Libraries (핵심 라이브러리 계층)

#### Observer Pattern
```javascript
// 옵저버 패턴 구현
export const createObserver = () => {
  const listeners = new Set();
  const subscribe = (fn) => listeners.add(fn);
  const notify = () => listeners.forEach((listener) => listener());

  return { subscribe, notify };
};
```

#### Router System
```javascript
// SPA 라우터 구현
export class Router {
  #routes = new Map();
  #route = null;
  #observer = createObserver();

  addRoute(path, handler) {
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

## 🔄 데이터 플로우

### 1. 사용자 액션 → 상태 변경 플로우

```
사용자 클릭 → 이벤트 핸들러 → Service 함수 → Store Dispatch → Reducer → 상태 업데이트 → UI 리렌더링
```

### 2. 상세 플로우 예시

```javascript
// 1. 사용자가 장바구니 버튼 클릭
addEvent("click", ".add-to-cart-btn", (e) => {
  const productId = e.target.getAttribute("data-product-id");
  addToCart(productId); // 2. Service 함수 호출
});

// 3. Service에서 Store에 액션 디스패치
export const addToCart = (product, quantity = 1) => {
  cartStore.dispatch({
    type: CART_ACTIONS.ADD_ITEM,
    payload: { product, quantity }
  });
  
  saveCartToStorage(); // 4. 로컬 스토리지 동기화
};

// 5. Reducer에서 상태 업데이트
const cartReducer = (state, action) => {
  switch (action.type) {
    case CART_ACTIONS.ADD_ITEM:
      return {
        ...state,
        items: [...state.items, newItem]
      };
  }
};

// 6. Store 변경 감지하여 UI 리렌더링
cartStore.subscribe(render);
```

### 3. 라우팅 플로우

```
URL 변경 → Router.push() → 히스토리 업데이트 → 라우트 매칭 → 페이지 컴포넌트 렌더링 → 라이프사이클 실행
```

## 🔗 모듈 의존성

### 의존성 그래프

```
main.js
├── render.js
│   ├── stores/
│   ├── router/
│   └── pages/
├── events.js
│   ├── services/
│   └── utils/
└── utils/
    ├── eventUtils.js
    ├── domUtils.js
    └── withBatch.js

pages/
├── PageWrapper.js
│   ├── stores/
│   └── components/
└── HomePage.js
    ├── components/
    ├── stores/
    ├── services/
    └── router/

services/
├── productService.js
│   ├── api/
│   ├── stores/
│   └── router/
└── cartService.js
    ├── stores/
    └── storage/

stores/
├── productStore.js
│   └── lib/
├── cartStore.js
│   ├── lib/
│   └── storage/
└── uiStore.js
    └── lib/

lib/
├── createStore.js
│   └── createObserver.js
├── Router.js
│   └── createObserver.js
└── createStorage.js
```

### 순환 의존성 방지

1. **단방향 의존성**: 상위 레이어에서 하위 레이어로만 의존
2. **인터페이스 분리**: 필요한 기능만 노출
3. **의존성 주입**: 런타임에 의존성 주입

## 🎨 디자인 패턴

### 1. Observer Pattern (옵저버 패턴)

```javascript
// 상태 변경 시 구독자들에게 알림
const { subscribe, notify } = createObserver();

// 구독
productStore.subscribe(render);

// 알림
const dispatch = (action) => {
  const newState = reducer(state, action);
  if (newState !== state) {
    state = newState;
    notify(); // 모든 구독자에게 알림
  }
};
```

### 2. Redux Pattern (리덕스 패턴)

```javascript
// 액션 → 리듀서 → 상태 업데이트
const action = { type: "SET_PRODUCTS", payload: { products, totalCount } };
const newState = reducer(currentState, action);
```

### 3. Event Delegation (이벤트 위임)

```javascript
// 상위 요소에서 하위 요소의 이벤트 처리
document.body.addEventListener("click", (e) => {
  const target = e.target.closest(".add-to-cart-btn");
  if (target) {
    const productId = target.getAttribute("data-product-id");
    addToCart(productId);
  }
});
```

### 4. Higher-Order Function (고차 함수)

```javascript
// 라이프사이클 관리
export const withLifecycle = ({ onMount, onUnmount, watches }, page) => {
  return (...args) => {
    // 마운트 로직
    if (wasNewPage) {
      mount(page);
    }
    
    // 의존성 감시
    if (lifecycle.watches) {
      lifecycle.watches.forEach(([getDeps, callback]) => {
        const newDeps = getDeps();
        if (depsChanged(newDeps, oldDeps)) {
          callback();
        }
      });
    }
    
    return page(...args);
  };
};
```

### 5. Factory Pattern (팩토리 패턴)

```javascript
// 스토어 생성 팩토리
export const createStore = (reducer, initialState) => {
  // 스토어 인스턴스 생성 로직
  return { getState, dispatch, subscribe };
};

// 스토리지 생성 팩토리
export const createStorage = (key, storage = window.localStorage) => {
  // 스토리지 인스턴스 생성 로직
  return { get, set, reset };
};
```

## ⚡ 성능 고려사항

### 1. 렌더링 최적화

```javascript
// 배치 렌더링으로 불필요한 리렌더링 방지
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

### 2. 메모리 관리

```javascript
// WeakMap을 사용한 메모리 누수 방지
const lifeCycles = new WeakMap();

// 이벤트 리스너 정리
const cleanup = () => {
  document.body.removeEventListener("click", handleGlobalEvents);
};
```

### 3. 네트워크 최적화

```javascript
// 무한 스크롤로 초기 로딩 시간 단축
export const loadMoreProducts = async () => {
  const state = productStore.getState();
  const hasMore = state.products.length < state.totalCount;

  if (!hasMore || state.loading) return;

  router.query = { current: Number(router.query.current ?? 1) + 1 };
  await loadProducts(false); // 기존 목록에 추가
};
```

### 4. 이미지 최적화

```html
<!-- 지연 로딩으로 초기 렌더링 속도 향상 -->
<img src="${image}" alt="${title}" loading="lazy">
```

### 5. 코드 분할

```javascript
// 동적 임포트로 초기 번들 크기 최적화
const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker }) =>
    worker.start({
      serviceWorker: { url: `${BASE_URL}mockServiceWorker.js` },
      onUnhandledRequest: "bypass"
    })
  );
```

## 🔧 확장성 고려사항

### 1. 모듈화

- 각 기능별로 독립적인 모듈 구성
- 명확한 인터페이스 정의
- 느슨한 결합, 강한 응집

### 2. 플러그인 시스템

```javascript
// 라우터에 미들웨어 추가 가능
router.use((req, res, next) => {
  // 인증, 로깅 등
  next();
});
```

### 3. 테스트 가능성

- 순수 함수 중심 설계
- 의존성 주입을 통한 모킹 가능
- 단위 테스트 친화적 구조

이러한 아키텍처 설계를 통해 **유지보수성**, **확장성**, **성능**을 모두 고려한 견고한 애플리케이션을 구축할 수 있습니다.
