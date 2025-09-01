# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소의 코드를 작업할 때 지침을 제공합니다.

## 프로젝트 개요

쇼핑 애플리케이션을 다양한 렌더링 전략(CSR, SSR, SSG)으로 구현한 모노레포입니다. 바닐라 자바스크립트와 React 구현으로 나뉘어 있으며, 공유 라이브러리와 별도 패키지로 모듈화된 구조를 따릅니다.

## 주요 구현 목표
- **Express SSR 서버 구현**: 미들웨어 기반 서버와 개발/프로덕션 환경 분기
- **Static Site Generation**: 빌드 타임 페이지 생성 및 동적 라우트 처리  
- **서버/클라이언트 데이터 공유**: `window.__INITIAL_DATA__`를 통한 하이드레이션

## 워크스페이스 구조

- **pnpm 모노레포** 워크스페이스 설정
- **packages/lib**: 커스텀 React-like 훅, 상태 관리, 라우팅을 포함한 공유 유틸리티 라이브러리
- **packages/vanilla**: 바닐라 자바스크립트 구현 (CSR/SSR/SSG 지원)
- **packages/react**: React 구현 (CSR/SSR/SSG 지원)

## 주요 명령어

### 개발
```bash
# 의존성 설치
pnpm install

# 모든 패키지 빌드
pnpm run build

# 모든 패키지 린트 및 수정
pnpm run lint:fix

# 모든 패키지 타입 체크
pnpm run tsc

# 코드 포맷팅
pnpm run prettier:write
```

### 테스트
```bash
# 단위 테스트 (lib 패키지만)
pnpm run test:unit

# E2E 테스트
pnpm run test:e2e
pnpm run test:e2e:basic      # 기본 기능 테스트
pnpm run test:e2e:advanced   # 고급 테스트
pnpm run test:e2e:ui         # 인터랙티브 테스트 러너
pnpm run test:e2e:report     # 테스트 리포트 보기

# lib 테스트 직접 실행
pnpm -F @hanghae-plus/lib test
pnpm -F @hanghae-plus/lib test:basic
pnpm -F @hanghae-plus/lib test:advanced
```

### 모든 서버 동시 실행 (테스트용)
```bash
# 모든 렌더링 방식 서버를 한 번에 실행
pnpm run serve:test
```

### 패키지별 명령어

#### 바닐라 패키지 (@hanghae-plus/shopping-vanilla)
```bash
# 개발 서버
pnpm -F @hanghae-plus/shopping-vanilla dev          # CSR 개발서버 (포트 5173)
pnpm -F @hanghae-plus/shopping-vanilla dev:ssr      # SSR 개발서버 (포트 5174)

# 프로덕션 빌드
pnpm -F @hanghae-plus/shopping-vanilla build:client           # CSR 빌드
pnpm -F @hanghae-plus/shopping-vanilla build:server           # SSR 빌드
pnpm -F @hanghae-plus/shopping-vanilla build:ssg              # SSG 빌드
pnpm -F @hanghae-plus/shopping-vanilla build:without-ssg      # CSR + SSR 빌드
pnpm -F @hanghae-plus/shopping-vanilla build                  # 전체 빌드 (CSR + SSR + SSG)

# 빌드된 애플리케이션 미리보기
pnpm -F @hanghae-plus/shopping-vanilla preview:csr            # CSR 미리보기 (포트 4173)
pnpm -F @hanghae-plus/shopping-vanilla preview:ssr            # SSR 미리보기 (포트 4174)
pnpm -F @hanghae-plus/shopping-vanilla preview:ssg            # SSG 미리보기 (포트 4178)

# 빌드와 미리보기를 한 번에
pnpm -F @hanghae-plus/shopping-vanilla preview:csr-with-build
pnpm -F @hanghae-plus/shopping-vanilla preview:ssr-with-build
pnpm -F @hanghae-plus/shopping-vanilla preview:ssg-with-build

# 모든 변형 서버 테스트용 실행
pnpm -F @hanghae-plus/shopping-vanilla serve:test
```

#### 리액트 패키지 (@hanghae-plus/shopping-react)
```bash
# 개발 서버
pnpm -F @hanghae-plus/shopping-react dev          # CSR 개발서버 (포트 5175)
pnpm -F @hanghae-plus/shopping-react dev:ssr      # SSR 개발서버 (포트 5176)

# 프로덕션 빌드
pnpm -F @hanghae-plus/shopping-react build:client           # CSR 빌드
pnpm -F @hanghae-plus/shopping-react build:server           # SSR 빌드
pnpm -F @hanghae-plus/shopping-react build:ssg              # SSG 빌드
pnpm -F @hanghae-plus/shopping-react build:without-ssg      # CSR + SSR 빌드
pnpm -F @hanghae-plus/shopping-react build                  # 전체 빌드

# 빌드된 애플리케이션 미리보기
pnpm -F @hanghae-plus/shopping-react preview:csr            # CSR 미리보기 (포트 4175)
pnpm -F @hanghae-plus/shopping-react preview:ssr            # SSR 미리보기 (포트 4176)
pnpm -F @hanghae-plus/shopping-react preview:ssg            # SSG 미리보기 (포트 4179)

# 빌드와 미리보기를 한 번에
pnpm -F @hanghae-plus/shopping-react preview:csr-with-build
pnpm -F @hanghae-plus/shopping-react preview:ssr-with-build
pnpm -F @hanghae-plus/shopping-react preview:ssg-with-build

# 모든 변형 서버 테스트용 실행
pnpm -F @hanghae-plus/shopping-react serve:test
```

## 아키텍처

### 핵심 라이브러리 (@hanghae-plus/lib)
- **커스텀 React-like 훅**: `useCallback`, `useMemo`, `useRef`, `useStore` 등
- **상태 관리**: 구독 패턴을 가진 `createStore`, `createObserver`
- **라우팅**: 파라미터 추출과 네비게이션을 지원하는 커스텀 `Router` 클래스
- **스토리지**: localStorage/sessionStorage 추상화를 위한 `createStorage`
- **동등성 비교**: `baseEquals`, `shallowEquals`, `deepEquals`
- **고차 컴포넌트**: 성능 최적화를 위한 `memo`, `deepMemo`

### 렌더링 전략
바닐라와 React 패키지 모두 지원:
- **CSR (Client-Side Rendering)**: 표준 SPA 동작
- **SSR (Server-Side Rendering)**: 하이드레이션을 포함한 Express 기반 서버
- **SSG (Static Site Generation)**: 빌드 타임에 미리 생성된 정적 페이지

### 핵심 구현 패턴

#### 1. Express 서버 (server.js)
**핵심 키워드**: middleware, template, render, hydration

```javascript
// 환경 분기
if (!prod) {
  // Vite dev server + middleware
} else {
  // compression + sirv
}

// 렌더링 파이프라인
app.use("*", async (req, res) => {
  const url = req.originalUrl.replace(base, "");
  const { html, head, initialData } = await render(url);

  // Template 치환
  const finalHtml = template
    .replace("<!--app-head-->", head)
    .replace("<!--app-html-->", html)
    .replace("</head>", `${initialDataScript}</head>`);
});
```

#### 2. 서버 렌더링 (main-server.js)
**핵심 키워드**: routing, prefetch, store, params

```javascript
class ServerRouter {
  addRoute(path, handler) {
    // :id → (\\d+) 정규식 변환
    // paramNames 배열 저장
  }

  findRoute(url) {
    // 매칭 + params 추출
    return { handler, params };
  }
}

async function prefetchData(route, params) {
  if (route.path === "/") {
    // mockGetProducts + mockGetCategories
    // productStore.dispatch(SETUP)
  } else if (route.path === "/product/:id/") {
    // mockGetProduct(params.id)
    // productStore.dispatch(SET_CURRENT_PRODUCT)
  }
}

export async function render(url) {
  // 1. Store 초기화
  // 2. 라우트 매칭
  // 3. 데이터 프리페칭
  // 4. HTML 생성
  return { html, head, initialData };
}
```

#### 3. SSG (static-site-generate.js)
**핵심 키워드**: build-time, dynamic routes, file generation

```javascript
async function generateStaticSite() {
  // 1. 템플릿 + SSR 모듈 로드
  const template = await fs.readFile(`${DIST_DIR}/index.html`);
  const { render } = await import(`${SSR_DIR}/main-server.js`);

  // 2. 페이지 목록 생성
  const pages = await getPages(); // /, /404, /product/1/, /product/2/, ...

  // 3. 각 페이지 렌더링 + 저장
  for (const page of pages) {
    const rendered = await render(page.url);
    const html = template.replace(/* ... */);
    await saveHtmlFile(page.filePath, html);
  }
}

async function getPages() {
  const products = await mockGetProducts({ limit: 20 });
  return [
    { url: "/", filePath: `${DIST_DIR}/index.html` },
    { url: "/404", filePath: `${DIST_DIR}/404.html` },
    ...products.map(p => ({
      url: `/product/${p.id}/`,
      filePath: `${DIST_DIR}/product/${p.id}/index.html`
    }))
  ];
}
```

#### 4. 하이드레이션 (main.js)
**핵심 키워드**: client-side, initial data, store sync

```javascript
// 서버 데이터 복원
if (window.__INITIAL_DATA__) {
  const data = window.__INITIAL_DATA__;
  if (data.products) productStore.dispatch(PRODUCT_ACTIONS.SETUP, data);
  if (data.currentProduct) productStore.dispatch(PRODUCT_ACTIONS.SET_CURRENT_PRODUCT, data);
  delete window.__INITIAL_DATA__;
}

render(); // 클라이언트 렌더링 시작
```

### 엔티티 기반 구조 (React)
- **entities/products**: 상품 목록, 필터링, 상세보기
- **entities/carts**: 로컬 스토리지를 활용한 장바구니 기능
- **components**: 공유 UI 컴포넌트 (Modal, Toast 등)
- **pages**: 라우트별 페이지 컴포넌트

### 목 데이터 & API
- 개발 중 API 모킹을 위한 MSW(Mock Service Worker)
- `mocks/items.json`의 JSON 기반 상품 데이터
- `api/productApi.js`의 API 계층 추상화

## 구현 체크리스트 (BASIC_REQUIREMENTS.md 기준)

### Express SSR 서버
- [ ] Express 미들웨어 기반 서버 구현
- [ ] 개발/프로덕션 환경 분기 처리
- [ ] HTML 템플릿 치환 (`<!--app-html-->`, `<!--app-head-->`)

### 서버 사이드 렌더링
- [ ] 서버에서 동작하는 Router 구현
- [ ] 서버 데이터 프리페칭 (상품 목록, 상품 상세)
- [ ] 서버 상태관리 초기화

### 클라이언트 Hydration
- [ ] `window.__INITIAL_DATA__` 스크립트 주입
- [ ] 클라이언트 상태 복원
- [ ] 서버-클라이언트 데이터 일치

### Static Site Generation
- [ ] 동적 라우트 SSG (상품 상세 페이지들)
- [ ] 빌드 타임 페이지 생성
- [ ] 파일 시스템 기반 배포

## 개발 참고사항

### TypeScript 설정
- 번들러 모듈 해석을 사용한 ES 모듈
- 엄격한 타입 체크 활성화
- no emit 모드 (빌드는 Vite에서 처리)
- 워크스페이스 전체 TypeScript 설정

### 빌드 시스템
- **Vite** (Rolldown 변형) 번들링
- **Vitest** 단위 테스트
- **Playwright** E2E 테스트
- **ESLint + Prettier** 코드 품질

### 환경 요구사항
- Node.js >= 22
- pnpm >= 10

### Git Hooks
- pre-commit 훅을 위한 Husky
- 스테이징된 파일 포맷팅을 위한 lint-staged

### 테스트 통과 목표
기본 과제 완료 후 다음 명령어로 테스트 통과 확인:
```bash
pnpm run test:e2e:basic
```