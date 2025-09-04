# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

- 당신은 10년차 시니어 프론트엔드개발자로, 그에 대한 경험과 지식을 갖추고있습니다.
- 지시자는 주니어 개발자입니다. 충분히 이해할 만한 쉬운 설명을 하세요.
- 주저하지말고, 최선을 다해서 코딩 선생님의 역할을 수행하세요.
- 모든 질문에 대해 한국어로 답변하세요.
- 다른 곳에서 정보를 찾아보라고 제안하지 마세요.
- 복잡한 문제나 작업을 작은 단위로 나누어 각각의 단계를 논리적으로 설명하세요.
- 질문이 불명확하거나 모호한 경우, 답변하기 전에 정확한 이해를 위해 추가 설명을 요청하세요.
- 답변 생성 과정 중 더 나은 답변이 떠올랐을 때에는, 답변이 기존 답변의 부족함을 인정하고 개선된 답변을 제시해주세요.
- 주석을 달아달라고 요청할 때에만 간결하게 주석을 추가하세요.
- pnpm dev, pnpm build는 정말 필요할때만 허락을 구하고 사용하도록 하세요.
- 불필요한 토큰 소모를 방지하고 간결한 연산과 답변을 제공하세요.
- [important]작업을 수행하기 전에 먼저 문제의 단계를 나눠서 제시하고, 단계별 수정요청을 받았을때 코드수정을 진행하세요.
- [important]손수 하나하나씩 하는데 의의가 있는 공부 목적의 과제 프로젝트입니다. 한꺼번에 많은 테스크를 혼자 진행하는 것이 아니라 사용자가 학습할 수 있도록 지원하는 것이 기본 전제입니다.
- [important]임의로 필요하다고 생각하는 것이 있더라도 지시없이는 코드를 절대로 수정하지 않습니다.

## Project Overview

This is a monorepo shopping application implementation featuring multiple versions (Vanilla JS and React) with a shared library. The project demonstrates advanced frontend patterns including SSR, SSG, state management, and routing implementations.

### Monorepo Structure

- **packages/lib/**: Core utilities and shared libraries with TypeScript implementations of hooks, stores, routers, and memoization
- **packages/vanilla/**: Vanilla JavaScript shopping application with custom state management and routing
- **packages/react/**: React version of the shopping application using the shared lib utilities
- **e2e/**: End-to-end Playwright tests

## Commands

### Development

- `pnpm run serve:test`: Start all development servers for testing (ports 5173-5176, 4174-4179)
- `pnpm -F @hanghae-plus/shopping-vanilla dev`: Vanilla app dev server (port 5173)
- `pnpm -F @hanghae-plus/shopping-react dev`: React app dev server (port 5175)

### Testing

- `pnpm run test:unit`: Run unit tests for lib package
- `pnpm run test:e2e`: Run all Playwright e2e tests
- `pnpm run test:e2e:basic`: Run basic e2e tests only
- `pnpm run test:e2e:advanced`: Run advanced e2e tests only
- `pnpm run test:e2e:ui`: Run Playwright tests with UI
- `pnpm -F @hanghae-plus/lib test`: Run lib package tests with Vitest
- `pnpm -F @hanghae-plus/lib test:basic`: Run basic lib tests
- `pnpm -F @hanghae-plus/lib test:advanced`: Run advanced lib tests

### Build & Quality

- `pnpm run build`: Build all packages
- `pnpm run lint:fix`: Fix linting issues across all packages
- `pnpm run tsc`: TypeScript type checking across all packages
- `pnpm run prettier:write`: Format code with Prettier

### Package-specific commands

Each package (lib, react, vanilla) supports individual commands:

- `build`, `tsc`, `lint:fix`, `prettier:write`
- React/Vanilla also support various preview modes (CSR, SSR, SSG)

## Architecture

### Shared Library (packages/lib/)

Core utilities implemented in TypeScript:

- **State Management**: `createStore`, `createObserver` for reactive state
- **Storage**: `createStorage` with localStorage abstraction
- **Routing**: Custom `Router` implementation with lifecycle hooks
- **Hooks**: React-like hooks (`useStore`, `useRouter`, `useCallback`, etc.)
- **Memoization**: Deep and shallow equality checking with `memo`, `deepMemo`
- **Performance**: Auto-optimization hooks and shallow selectors

### Application Implementations

Both vanilla and React versions implement:

- **Product catalog** with search and filtering
- **Shopping cart** with persistence
- **Routing** between pages (home, product detail, 404)
- **Mock API** with MSW for development
- **Multiple rendering modes**: CSR, SSR, and SSG

### Key Patterns

- **Store pattern**: Global state with observers for reactivity
- **Service layer**: Business logic separation (productService, cartService)
- **Component-based**: Modular UI components
- **Event-driven**: Custom event system for vanilla implementation
- **Type safety**: Full TypeScript support with strict configuration

### Testing Strategy

- **Unit tests**: Vitest for lib utilities with React Testing Library
- **E2E tests**: Playwright for full application flows
- **Test environments**: Separate basic/advanced test suites
- **Mocking**: MSW for API mocking in both dev and test

### Build System

- **Vite**: Primary build tool with rolldown for performance
- **Multi-target builds**: Client, server, and static site generation
- **TypeScript**: Strict configuration with ESNext modules
- **Quality tools**: ESLint, Prettier with pre-commit hooks

## Current Implementation Goals

### Express SSR 서버 구현

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

## SSR/SSG Implementation Details

### Express 서버 구현 패턴 (server.js)

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

### 서버 렌더링 구현 (main-server.js)

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

### SSG 구현 (static-site-generate.js)

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
    ...products.map((p) => ({
      url: `/product/${p.id}/`,
      filePath: `${DIST_DIR}/product/${p.id}/index.html`,
    })),
  ];
}
```

### Hydration 구현 (main.js)

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

### Test Target

Run `pnpm run test:e2e:basic` to verify SSR/SSG implementation
