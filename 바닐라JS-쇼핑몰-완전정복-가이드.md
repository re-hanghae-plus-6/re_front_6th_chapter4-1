# 🛒 바닐라 JavaScript 쇼핑몰 완전 정복 가이드

> **주니어 개발자를 위한 실전 바닐라 JS 프로젝트 완벽 이해서**  
> CSR/SSR/SSG 3가지 렌더링 모드를 바닐라 JS로 구현하는 방법

---

## 🎯 프로젝트 개요

이 프로젝트는 **React/Vue 없이 순수 JavaScript만으로** 현대적인 쇼핑몰을 만드는 프로젝트입니다.

### 🔥 핵심 특징
- **3가지 렌더링 모드**: CSR, SSR, SSG 모두 지원
- **SPA 라우팅**: 페이지 새로고침 없는 부드러운 네비게이션
- **Redux-style 상태관리**: 중앙집중식 상태 관리
- **컴포넌트 기반 아키텍처**: 재사용 가능한 함수형 컴포넌트

---

## 🏗️ 프로젝트 구조 이해

```
src/
├── 📁 api/           # 외부 API 통신
├── 📁 components/    # 재사용 가능한 UI 컴포넌트
├── 📁 lib/          # 핵심 라이브러리 (Router, Store 등)
├── 📁 pages/        # 페이지 컴포넌트
├── 📁 router/       # 라우팅 설정
├── 📁 services/     # 비즈니스 로직
├── 📁 stores/       # 상태 관리 (Redux-style)
├── 📁 storage/      # 로컬스토리지 관리
├── 📁 utils/        # 유틸리티 함수들
├── main.js          # CSR 엔트리포인트
└── main-server.js   # SSR 엔트리포인트
```

---

## 🎨 핵심 개념 이해

### 1. 🔄 **상태 관리 패턴 (Redux-style)**

#### 왜 상태 관리가 필요한가?
```javascript
// ❌ 문제: 여러 컴포넌트에서 같은 데이터를 각각 관리
function ProductList() {
  let products = [];  // 여기서 관리
}

function SearchBar() {
  let products = [];  // 여기서도 관리 (중복!)
}
```

#### ✅ 해결책: 중앙집중식 상태 관리
```javascript
// stores/productStore.js
export const productStore = createStore({
  products: [],      // 모든 상품 데이터
  categories: [],    // 카테고리 데이터
  loading: false,    // 로딩 상태
  error: null        // 에러 상태
});

// 어디서든 같은 데이터 사용
const products = productStore.getState().products;
```

#### 🔄 Action 기반 상태 변경
```javascript
// 상태 변경은 반드시 Action을 통해!
productStore.dispatch({
  type: 'SET_PRODUCTS',
  payload: newProducts
});
```

### 2. 🧩 **컴포넌트 패턴**

#### 함수형 컴포넌트
```javascript
// components/ProductCard.js
export const ProductCard = ({ product }) => {
  return `
    <div class="product-card" data-product-id="${product.id}">
      <img src="${product.image}" alt="${product.title}">
      <h3>${product.title}</h3>
      <span>${product.price}원</span>
    </div>
  `;
};
```

#### 재사용성과 조합
```javascript
// pages/HomePage.js
export const HomePage = () => {
  const { products } = productStore.getState();
  
  return `
    <div>
      ${SearchBar()}
      <div class="products-grid">
        ${products.map(product => ProductCard({ product })).join('')}
      </div>
    </div>
  `;
};
```

### 3. 🛣️ **SPA 라우팅 시스템**

#### 전통적인 웹 vs SPA
```javascript
// ❌ 전통적인 웹: 페이지마다 새로고침
// /product/123 → 서버에서 새 HTML 받아옴

// ✅ SPA: 같은 페이지에서 내용만 교체
// /product/123 → JavaScript로 내용만 바꿈
```

#### 라우터 구현 원리
```javascript
// lib/Router.js
class Router {
  constructor() {
    this.routes = [];
    
    // 브라우저 뒤로가기/앞으로가기 감지
    window.addEventListener('popstate', () => {
      this.handleRoute();
    });
  }
  
  // 라우트 등록
  addRoute(path, component) {
    this.routes.push({ path, component });
  }
  
  // URL 변경 시 해당 컴포넌트 렌더링
  navigate(path) {
    history.pushState(null, '', path);  // URL 변경 (새로고침 없이)
    this.handleRoute();                 // 컴포넌트 렌더링
  }
}
```

### 4. 🔄 **하이드레이션 (Hydration)**

#### SSR → CSR 전환 과정
```javascript
// 1. 서버에서 정적 HTML 생성
const serverHTML = renderToString(HomePage);

// 2. 클라이언트에서 JavaScript 로드 후
// 3. 정적 HTML에 이벤트 리스너 연결 (Hydration)
function hydrate() {
  // 서버 HTML은 그대로 두고
  // JavaScript 기능만 추가
  document.querySelectorAll('[data-action]').forEach(element => {
    element.addEventListener('click', handleClick);
  });
}
```

#### 왜 하이드레이션이 필요한가?
- **SEO**: 서버에서 완성된 HTML 제공
- **성능**: 첫 화면을 빠르게 보여줌
- **UX**: 이후 상호작용은 SPA처럼 부드럽게

---

## 🚀 3가지 렌더링 모드

### 1. 📱 **CSR (Client-Side Rendering)**
```javascript
// main.js - 브라우저에서 실행
function main() {
  // 1. 빈 HTML에서 시작
  // 2. JavaScript로 API 호출
  // 3. 동적으로 HTML 생성
  initRender();
  router.start();
}
```

**장점**: 상호작용이 빠름  
**단점**: 첫 로딩이 느림, SEO 불리

### 2. 🖥️ **SSR (Server-Side Rendering)**
```javascript
// main-server.js - 서버에서 실행
export const render = async (url, query) => {
  // 1. 서버에서 API 호출
  const products = await getProducts();
  
  // 2. 서버에서 HTML 생성
  const html = HomePage({ products });
  
  // 3. 완성된 HTML을 클라이언트로 전송
  return { html, data: { products } };
};
```

**장점**: 첫 로딩 빠름, SEO 좋음  
**단점**: 서버 부하 증가

### 3. 📄 **SSG (Static Site Generation)**
```javascript
// static-site-generate.js - 빌드 시 실행
async function generateStaticSite() {
  // 1. 빌드 시점에 API 호출
  const products = await getProducts();
  
  // 2. 정적 HTML 파일 생성
  const html = HomePage({ products });
  fs.writeFileSync('dist/index.html', html);
}
```

**장점**: 가장 빠름, CDN 배포 가능  
**단점**: 동적 데이터 제한

---

## 🔧 핵심 구현 패턴

### 1. **Store 패턴 (상태 관리)**

#### createStore 구현
```javascript
// lib/createStore.js
export const createStore = (initialState) => {
  let state = initialState;
  let listeners = [];
  
  return {
    // 상태 조회
    getState: () => state,
    
    // 상태 변경 (불변성 유지)
    dispatch: (action) => {
      state = reducer(state, action);
      listeners.forEach(listener => listener(state));
    },
    
    // 상태 변경 감지
    subscribe: (listener) => {
      listeners.push(listener);
    }
  };
};
```

#### 실제 사용 예시
```javascript
// stores/productStore.js
export const productStore = createStore({
  products: [],
  loading: false,
  error: null
});

// 상품 로딩 시작
productStore.dispatch({
  type: 'SET_LOADING',
  payload: true
});

// API 호출 후 상품 설정
productStore.dispatch({
  type: 'SET_PRODUCTS', 
  payload: products
});
```

### 2. **이벤트 위임 패턴**

#### 문제: 동적 요소에 이벤트 연결
```javascript
// ❌ 문제: 새로 추가된 버튼에는 이벤트가 없음
document.querySelectorAll('.add-to-cart').forEach(btn => {
  btn.addEventListener('click', handleAddToCart);
});
```

#### ✅ 해결책: 이벤트 위임
```javascript
// 부모 요소에 한 번만 이벤트 등록
document.body.addEventListener('click', (e) => {
  const action = e.target.dataset.action;
  
  switch(action) {
    case 'add-to-cart':
      handleAddToCart(e);
      break;
    case 'product-detail':
      handleProductDetail(e);
      break;
  }
});
```

### 3. **서버-클라이언트 데이터 공유**

#### window.__INITIAL_DATA__ 패턴
```javascript
// 서버에서 HTML 생성 시
const html = `
  <script>
    window.__INITIAL_DATA__ = ${JSON.stringify(data)};
  </script>
  ${pageHTML}
`;

// 클라이언트에서 데이터 사용
const initialData = window.__INITIAL_DATA__;
productStore.dispatch({
  type: 'SET_PRODUCTS',
  payload: initialData.products
});
```

---

## 🐛 주요 트러블슈팅

### 1. **ES 모듈 import 문제**
```javascript
// ❌ Node.js에서 에러 발생
import { something } from "./folder";

// ✅ 해결책: .js 확장자 명시
import { something } from "./folder/index.js";
```

### 2. **SSR 라우팅 문제**
```javascript
// ❌ 복잡한 라우터 클래스 사용
const router = new ServerRouter();
const route = router.findRoute(url); // 복잡하고 디버깅 어려움

// ✅ 단순한 정규식 매칭
const productMatch = url.match(/^\/product\/(\d+)\/$/);
if (productMatch) {
  const productId = productMatch[1];
  // 상품 상세 페이지 렌더링
}
```

### 3. **하이드레이션 미스매치**
```javascript
// ❌ 서버와 클라이언트 HTML이 다름
// 서버: <div>Loading...</div>
// 클라이언트: <div>Products loaded</div>

// ✅ 동일한 초기 상태 보장
const initialData = window.__INITIAL_DATA__;
store.setState(initialData); // 서버와 같은 상태로 시작
```

---

## 🎓 학습 포인트

### **주니어 개발자가 배울 수 있는 것들:**

1. **🏗️ 아키텍처 설계**
   - 관심사 분리 (UI / 상태 / 로직)
   - 모듈화와 의존성 관리
   - 확장 가능한 구조 설계

2. **🔄 상태 관리의 중요성**
   - 왜 전역 상태가 필요한가?
   - 불변성 유지의 중요성
   - 예측 가능한 상태 변경

3. **🌐 웹 표준 이해**
   - History API 활용
   - 이벤트 위임 패턴
   - DOM 조작 최적화

4. **⚡ 성능 최적화**
   - 렌더링 최적화
   - 메모리 누수 방지
   - 번들 크기 최적화

---

## 🛠️ 실전 구현 팁

### **1. 컴포넌트 작성 시 주의사항**
```javascript
// ✅ 순수 함수로 작성
export const ProductCard = ({ product, onClick }) => {
  return `
    <div class="product-card" 
         data-action="product-detail" 
         data-product-id="${product.id}">
      <h3>${escapeHtml(product.title)}</h3>  <!-- XSS 방지 -->
      <span>${formatPrice(product.price)}</span>
    </div>
  `;
};

// ❌ 피해야 할 패턴
export const BadProductCard = (product) => {
  // DOM 조작이 섞여있음
  const div = document.createElement('div');
  div.innerHTML = product.title;  // XSS 위험
  return div.outerHTML;
};
```

### **2. 이벤트 처리 패턴**
```javascript
// ✅ 중앙집중식 이벤트 처리
export const handleGlobalClick = (e) => {
  const action = e.target.dataset.action;
  const productId = e.target.dataset.productId;
  
  switch(action) {
    case 'add-to-cart':
      addToCart(productId);
      break;
    case 'product-detail':
      router.navigate(`/product/${productId}/`);
      break;
  }
};

// HTML에서는 data-action만 설정
<button data-action="add-to-cart" data-product-id="123">
  장바구니 담기
</button>
```

### **3. SSR 구현 핵심**
```javascript
// main-server.js
export const render = async (url, query) => {
  // 1. URL 분석
  const isProductDetail = url.match(/^\/product\/(\d+)\/$/);
  
  // 2. 필요한 데이터 미리 로드
  if (isProductDetail) {
    const product = await getProduct(productId);
    const relatedProducts = await getProducts({ category: product.category });
    
    // 3. 서버에서 HTML 생성
    const html = ProductDetailPage({ product, relatedProducts });
    
    // 4. 클라이언트로 데이터와 함께 전송
    return {
      html,
      head: `<title>${product.title} - 쇼핑몰</title>`,
      data: { product, relatedProducts }
    };
  }
};
```

---

## 🎯 고급 패턴

### **1. 옵저버 패턴으로 반응형 UI**
```javascript
// stores가 변경되면 자동으로 UI 업데이트
productStore.subscribe((newState) => {
  if (newState.products !== prevState.products) {
    renderProductList(newState.products);
  }
});
```

### **2. 메모이제이션으로 성능 최적화**
```javascript
const memoizedRender = memo((products) => {
  return products.map(product => ProductCard({ product })).join('');
});

// 같은 products 배열이면 이전 결과 재사용
```

### **3. 에러 바운더리 패턴**
```javascript
export const withErrorBoundary = (component) => {
  return (props) => {
    try {
      return component(props);
    } catch (error) {
      console.error('Component render error:', error);
      return `<div class="error">오류가 발생했습니다.</div>`;
    }
  };
};
```

---

## 🚨 흔한 실수와 해결책

### **1. 메모리 누수**
```javascript
// ❌ 이벤트 리스너 정리 안함
element.addEventListener('click', handler);

// ✅ 정리 함수 제공
export const cleanup = () => {
  element.removeEventListener('click', handler);
};
```

### **2. XSS 보안 취약점**
```javascript
// ❌ 사용자 입력을 그대로 HTML에 삽입
innerHTML = userInput;

// ✅ 이스케이프 처리
innerHTML = escapeHtml(userInput);
```

### **3. 상태 불변성 위반**
```javascript
// ❌ 기존 객체 직접 수정
state.products.push(newProduct);

// ✅ 새로운 객체 생성
state = {
  ...state,
  products: [...state.products, newProduct]
};
```

---

## 🎉 프로젝트의 가치

### **왜 바닐라 JS로 이런 복잡한 걸 만드나요?**

1. **🧠 근본 이해**: 프레임워크 없이 웹의 기본 원리 학습
2. **🔧 문제 해결 능력**: 직접 구현하며 깊은 이해 획득
3. **⚡ 성능 최적화**: 불필요한 라이브러리 없이 가벼운 앱
4. **🎯 실무 역량**: 어떤 프레임워크든 빠르게 적응 가능

### **실무에서의 활용**
- **레거시 시스템** 유지보수
- **마이크로 프론트엔드** 구현
- **성능 크리티컬한 서비스** 개발
- **프레임워크 선택** 시 올바른 판단

---

## 📚 추가 학습 자료

### **다음 단계로 학습할 것들:**
1. **웹 컴포넌트 (Web Components)**: 표준 기반 컴포넌트
2. **서비스 워커**: 오프라인 지원, 캐싱
3. **웹 어셈블리**: 고성능 웹 앱
4. **Progressive Web App**: 네이티브 앱 같은 웹

### **관련 프레임워크 이해:**
- **React**: 컴포넌트 + 상태관리 개념이 동일
- **Vue**: 반응형 시스템의 원리 이해
- **Svelte**: 컴파일 타임 최적화 아이디어

---

## 🎯 마무리

이 프로젝트는 단순한 **"바닐라 JS로 쇼핑몰 만들기"**가 아닙니다.

**현대 웹 개발의 모든 핵심 개념**을 바닐라 JS로 구현하며 깊이 이해하는 **종합 학습 프로젝트**입니다.

### **🏆 이 프로젝트를 완성하면:**
- 어떤 프레임워크든 빠르게 학습 가능
- 복잡한 상태 관리 시스템 설계 능력
- 성능 최적화에 대한 깊은 이해
- 웹 표준과 브라우저 API 활용 능력

**프레임워크는 도구일 뿐, 진짜 실력은 기본기에서 나옵니다!** 💪

---

*Made with ❤️ for Junior Developers*
