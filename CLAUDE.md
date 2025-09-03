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

**핵심 키워드**: Express 5.x, dynamic import, JSDoc types, SSR

```javascript
const isProduction = process.env.NODE_ENV === "production";

async function createServer() {
  const app = express();

  /** @type {import('vite').ViteDevServer | undefined} */
  let vite;

  // 환경별 미들웨어 설정
  if (!isProduction) {
    const { createServer } = await import("vite");
    vite = await createServer({
      server: { middlewareMode: true },
      appType: "custom",
      base,
    });
    app.use(vite.middlewares);
  } else {
    const compression = (await import("compression")).default;
    const sirv = (await import("sirv")).default;
    app.use(compression());
    app.use(base, sirv("./dist/vanilla-ssr/client", { extensions: [] }));
  }

  // Express 5.x 호환 라우팅 패턴
  app.use("/{*splat}", async (req, res) => {
    try {
      const url = req.originalUrl.replace(base, "");

      // 환경별 템플릿 및 렌더 함수 로드
      let template, render;
      if (!isProduction) {
        template = await fs.readFile("./index.html", "utf-8");
        template = await vite.transformIndexHtml(url, template);
        render = (await vite.ssrLoadModule("/src/main-server.js")).render;
      } else {
        template = await fs.readFile("./dist/vanilla-ssr/client/index.html", "utf-8");
        render = (await import("./dist/vanilla-ssr/server/main-server.js")).render;
      }

      const rendered = await render(url);

      // 템플릿 치환 (간소화된 버전)
      const html = template
        .replace("<!--app-head-->", rendered.head ?? "")
        .replace("<!--app-html-->", rendered.html ?? "");

      res.status(200).set({ "Content-Type": "text/html" }).send(html);
    } catch (e) {
      vite?.ssrFixStacktrace(e);
      res.status(500).end(e.stack);
    }
  });
}
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
    ...products.map((p) => ({
      url: `/product/${p.id}/`,
      filePath: `${DIST_DIR}/product/${p.id}/index.html`,
    })),
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

- [x] Express 미들웨어 기반 서버 구현 (`server.js` 완성)
- [x] 개발/프로덕션 환경 분기 처리
- [x] HTML 템플릿 치환 (`<!--app-html-->`, `<!--app-head-->`)

### 서버 사이드 렌더링

- [ ] 서버에서 동작하는 Router 구현 (`main-server.js` 플레이스홀더 상태)
- [ ] 서버 데이터 프리페칭 (상품 목록, 상품 상세) - Mock API 함수 필요
- [ ] 서버 상태관리 초기화

### 클라이언트 Hydration

- [x] `window.__INITIAL_DATA__` 스크립트 주입 구조 (`server.js` 완성)
- [ ] 클라이언트 상태 복원 (`main.js`에 하이드레이션 로직 없음)
- [ ] 서버-클라이언트 데이터 일치

### Static Site Generation

- [ ] 동적 라우트 SSG (`static-site-generate.js` 플레이스홀더 상태)
- [ ] 빌드 타임 페이지 생성
- [ ] 파일 시스템 기반 배포

## 현재 구현 상태 분석

### ✅ **구현 완료된 부분**

1. **Express 서버 인프라** (`packages/vanilla/server.js`)
   - Express 5.x 호환 라우팅 패턴
   - 개발/프로덕션 환경별 미들웨어 설정
   - Vite 개발 서버 통합
   - 템플릿 치환 및 초기 데이터 주입

2. **클라이언트 인프라**
   - Router 클래스 (파라미터 추출, 네비게이션)
   - Product Store (상태 관리, 액션 처리)
   - Product Services (API 호출 로직)
   - MSW 기반 Mock API
   - 페이지 컴포넌트들

### ❌ **미완성 부분**

1. **서버 렌더링 로직** (`packages/vanilla/src/main-server.js`)
   - 현재: 정적 "Hello SSR" 플레이스홀더
   - 필요: ServerRouter, 데이터 프리페칭, 실제 HTML 생성

2. **서버 호환 Mock API**
   - 현재: 클라이언트용 MSW 핸들러만 존재
   - 필요: `mockGetProducts`, `mockGetCategories`, `mockGetProduct` 서버 함수

3. **클라이언트 하이드레이션** (`packages/vanilla/src/main.js`)
   - 현재: `window.__INITIAL_DATA__` 처리 로직 없음
   - 필요: 서버 데이터로부터 스토어 복원

4. **정적 사이트 생성** (`packages/vanilla/static-site-generate.js`)
   - 현재: 기본 플레이스홀더
   - 필요: 동적 라우트 생성, 실제 페이지 빌드

## 다음 구현 단계

### 1단계: 서버 호환 Mock API 함수 생성
- `src/api/mockApi.js` 생성 (서버에서 사용 가능한 데이터 함수들)
- 기존 MSW 핸들러 로직을 서버 환경에 맞게 포팅

### 2단계: 서버 사이드 렌더링 완성
- `main-server.js`에 ServerRouter 클래스 구현
- 라우트별 데이터 프리페칭 로직 구현
- 페이지 컴포넌트 활용한 HTML 생성

### 3단계: 클라이언트 하이드레이션 구현
- `main.js`에 초기 데이터 복원 로직 추가
- 서버-클라이언트 상태 동기화

### 4단계: 정적 사이트 생성 완성
- 동적 라우트 생성 (`/product/:id/` 처리)
- 서버 렌더링 로직 재활용하여 정적 파일 생성

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
