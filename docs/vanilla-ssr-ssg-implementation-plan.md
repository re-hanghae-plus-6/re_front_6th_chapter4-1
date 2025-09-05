# Vanilla JavaScript SSR/SSG 구현 계획

## 📋 프로젝트 개요

**목표**: 바닐라 자바스크립트로 Express SSR 서버, Static Site Generation, 서버/클라이언트 데이터 공유를 구현하여 완전한 SSR/SSG 시스템을 구축

**핵심 요구사항**:

- Express SSR 서버 구현
- Static Site Generation (SSG)
- 서버/클라이언트 데이터 공유
- E2E 테스트 통과

## 🎯 구현 우선순위

### **1단계: Express SSR 서버 구축 (최우선)**

#### 1.1 기본 Express 서버 설정

- [ ] `server.js`에 필요한 모듈 import 추가
  - `fs` (파일 시스템)
  - `path` (경로 처리)
  - `sirv` (정적 파일 서빙)
  - `compression` (압축)
- [ ] 환경 분기 처리 (개발/프로덕션)
- [ ] 미들웨어 설정
  - 압축 미들웨어 (`compression()`)
  - 정적 파일 서빙 (`sirv`)
  - 개발 환경에서 Vite dev server 연동
- [ ] 포트 및 base path 설정

#### 1.2 HTML 템플릿 처리

- [ ] HTML 템플릿 읽기 로직 구현
- [ ] 템플릿 치환 로직 구현
  - `<!--app-html-->` → 서버 렌더링된 HTML
  - `<!--app-head-->` → 메타 태그, 스타일 등
  - `window.__INITIAL_DATA__` 스크립트 주입
- [ ] 에러 처리 및 폴백 HTML
- [ ] Content-Type 설정

#### 1.3 서버 라우팅

- [ ] 모든 라우트를 처리하는 `app.use("*")` 미들웨어
- [ ] URL 정규화 및 base path 처리
- [ ] SSR 렌더링 함수 호출
- [ ] 에러 핸들링

### **2단계: 서버 렌더링 엔진 구현**

#### 2.1 서버 라우터 클래스

- [ ] `ServerRouter` 클래스 구현
  - 라우트 등록 메서드 (`addRoute`)
  - 동적 라우트 매칭 (`findRoute`)
  - 파라미터 추출 로직 (`:id` → 정규식 변환)
- [ ] 라우트 패턴 처리
  - `/` (홈페이지)
  - `/product/:id/` (상품 상세)
  - `/404` (404 페이지)

#### 2.2 데이터 프리페칭

- [ ] 홈페이지 (`/`) 데이터 로드
  - `getProducts({ limit: 20 })` 호출
  - `productStore.dispatch({ type: "SETUP", payload: products })`
- [ ] 상품 상세 (`/product/:id/`) 데이터 로드
  - `getProduct(params.id)` 호출
  - `productStore.dispatch({ type: "SET_CURRENT_PRODUCT", payload: product })`
- [ ] 404 페이지 처리
- [ ] 스토어 초기화 및 리셋

#### 2.3 HTML 생성

- [ ] `main-server.js`에서 `render` 함수 구현
- [ ] 클라이언트 렌더링 함수 호출 (`clientRender`)
- [ ] 초기 데이터 수집 및 반환
  - `products`, `currentProduct`, `cart`, `ui` 상태
- [ ] 에러 처리 및 폴백 HTML

### **3단계: 클라이언트 하이드레이션**

#### 3.1 서버 데이터 복원

- [ ] `main.js`에 하이드레이션 로직 추가
- [ ] `window.__INITIAL_DATA__` 읽기
- [ ] 스토어 상태 복원
  - `productStore.dispatch({ type: "SETUP", payload: data.products })`
  - `productStore.dispatch({ type: "SET_CURRENT_PRODUCT", payload: data.currentProduct })`
  - `cartStore.dispatch({ type: "HYDRATE", payload: data.cart })`
  - `uiStore.dispatch({ type: "HYDRATE", payload: data.ui })`
- [ ] 초기 데이터 제거 (`delete window.__INITIAL_DATA__`)

#### 3.2 클라이언트 초기화

- [ ] 하이드레이션 후 클라이언트 렌더링 시작
- [ ] 라우터 시작
- [ ] 이벤트 리스너 등록
- [ ] MSW 모킹 활성화

### **4단계: Static Site Generation (SSG)**

#### 4.1 SSG 엔진 구현

- [ ] `static-site-generate.js` 완성
- [ ] 페이지 목록 생성 함수 (`getPages`)
  - 홈페이지 (`/`)
  - 404 페이지 (`/404`)
  - 상품 상세 페이지들 (`/product/:id/`)
- [ ] 디렉토리 생성 함수 (`ensureDirectoryExists`)
- [ ] HTML 파일 저장 함수 (`saveHtmlFile`)

#### 4.2 빌드 타임 페이지 생성

- [ ] HTML 템플릿 읽기
- [ ] SSR 모듈 로드
- [ ] 각 페이지별 렌더링 실행
- [ ] 초기 데이터 스크립트 주입
- [ ] 정적 HTML 파일 생성

#### 4.3 동적 라우트 처리

- [ ] 상품 목록에서 상품 ID 추출
- [ ] 각 상품별 정적 페이지 생성
- [ ] 파일 경로 구조: `dist/vanilla/product/{id}/index.html`

### **5단계: 테스트 및 최적화**

#### 5.1 빌드 및 테스트

- [ ] CSR 빌드 테스트 (`pnpm run build:client`)
- [ ] SSR 빌드 테스트 (`pnpm run build:server`)
- [ ] SSG 빌드 테스트 (`pnpm run build:ssg`)
- [ ] 통합 빌드 테스트 (`pnpm run build`)

#### 5.2 서버 실행 테스트

- [ ] CSR 서버 실행 (`pnpm run preview:csr`)
- [ ] SSR 서버 실행 (`pnpm run preview:ssr`)
- [ ] SSG 서버 실행 (`pnpm run preview:ssg`)
- [ ] 개발 서버 실행 (`pnpm run dev:ssr`)

#### 5.3 E2E 테스트

- [ ] 기본 테스트 실행 (`pnpm run test:e2e:basic`)
- [ ] UI 테스트 실행 (`pnpm run test:e2e:ui`)
- [ ] 테스트 실패 시 디버깅 및 수정

## 🔧 세부 구현 태스크

### **Task 1: Express 서버 기본 설정**

```javascript
// server.js
import express from "express";
import fs from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import sirv from "sirv";
import compression from "compression";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

const app = express();

// 압축 미들웨어
app.use(compression());

// 정적 파일 서빙
if (prod) {
  app.use(base, sirv("dist/vanilla", { dev: false }));
} else {
  // 개발 환경에서는 Vite dev server 사용
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });
  app.use(vite.middlewares);
}
```

### **Task 2: 서버 렌더링 함수**

```javascript
const render = async (url) => {
  try {
    const { render } = await import("./dist/vanilla-ssr/main-server.js");
    return await render(url);
  } catch (error) {
    console.error("Render error:", error);
    return { html: "<div>Error</div>", head: "", initialData: {} };
  }
};
```

### **Task 3: 라우트 처리 미들웨어**

```javascript
app.use("*", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");
    const { html, head, initialData } = await render(url);

    // HTML 템플릿 읽기
    const templatePath = prod ? join(__dirname, "dist/vanilla/index.html") : join(__dirname, "index.html");

    let template = fs.readFileSync(templatePath, "utf-8");

    // 초기 데이터 스크립트 생성
    const initialDataScript = initialData
      ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};</script>`
      : "";

    // 템플릿 치환
    const finalHtml = template
      .replace("<!--app-head-->", head || "")
      .replace("<!--app-html-->", html || "")
      .replace("</head>", `${initialDataScript}</head>`);

    res.status(200).set({ "Content-Type": "text/html" }).end(finalHtml);
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).end("Internal Server Error");
  }
});
```

### **Task 4: 서버 라우터 구현**

```javascript
// main-server.js
class ServerRouter {
  constructor() {
    this.routes = new Map();
  }

  addRoute(path, handler) {
    const paramNames = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1));
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${regexPath}$`);
    this.routes.set(path, { regex, paramNames, handler });
  }

  findRoute(url) {
    for (const [routePath, route] of this.routes) {
      const match = url.match(route.regex);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });
        return { ...route, params, path: routePath };
      }
    }
    return null;
  }
}
```

### **Task 5: 데이터 프리페칭**

```javascript
// 라우트 등록
serverRouter.addRoute("/", async () => {
  const products = await getProducts({ limit: 20 });
  productStore.dispatch({ type: "SETUP", payload: products });
  return { page: "home" };
});

serverRouter.addRoute("/product/:id/", async (params) => {
  const product = await getProduct(params.id);
  productStore.dispatch({ type: "SET_CURRENT_PRODUCT", payload: product });
  return { page: "product", product };
});

serverRouter.addRoute("/404", async () => {
  return { page: "404" };
});
```

### **Task 6: 클라이언트 하이드레이션**

```javascript
// main.js
function hydrateFromServer() {
  if (window.__INITIAL_DATA__) {
    const data = window.__INITIAL_DATA__;

    if (data.products) {
      productStore.dispatch({ type: "SETUP", payload: data.products });
    }

    if (data.currentProduct) {
      productStore.dispatch({ type: "SET_CURRENT_PRODUCT", payload: data.currentProduct });
    }

    if (data.cart) {
      cartStore.dispatch({ type: "HYDRATE", payload: data.cart });
    }

    if (data.ui) {
      uiStore.dispatch({ type: "HYDRATE", payload: data.ui });
    }

    delete window.__INITIAL_DATA__;
  }
}
```

### **Task 7: SSG 구현**

```javascript
// static-site-generate.js
async function getPages() {
  const products = await getProducts({ limit: 20 });

  const pages = [
    { url: "/", filePath: join(DIST_DIR, "index.html") },
    { url: "/404", filePath: join(DIST_DIR, "404.html") },
    ...products.map((product) => ({
      url: `/product/${product.id}/`,
      filePath: join(DIST_DIR, `product/${product.id}/index.html`),
    })),
  ];

  return pages;
}

async function generateStaticSite() {
  const template = fs.readFileSync(join(DIST_DIR, "index.html"), "utf-8");
  const { render } = await import(join(SSR_DIR, "main-server.js"));
  const pages = await getPages();

  for (const page of pages) {
    const { html, head, initialData } = await render(page.url);
    const initialDataScript = initialData
      ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};</script>`
      : "";

    const finalHtml = template
      .replace("<!--app-head-->", head || "")
      .replace("<!--app-html-->", html || "")
      .replace("</head>", `${initialDataScript}</head>`);

    await saveHtmlFile(page.filePath, finalHtml);
  }
}
```

## 🚀 실행 순서

### **개발 단계**

1. **기본 설정**: Express 서버 기본 구조 구현
2. **서버 렌더링**: `main-server.js` 구현
3. **하이드레이션**: 클라이언트 데이터 복원 구현
4. **SSG**: 정적 사이트 생성 구현
5. **테스트**: 각 단계별 빌드 및 실행 테스트

### **빌드 순서**

```bash
# 1. 클라이언트 빌드
pnpm run build:client

# 2. 서버 빌드
pnpm run build:server

# 3. SSG 빌드
pnpm run build:ssg

# 4. 통합 빌드
pnpm run build
```

### **실행 순서**

```bash
# 개발 서버
pnpm run dev:ssr

# 프로덕션 서버
pnpm run preview:ssr

# SSG 서버
pnpm run preview:ssg

# 모든 서버 테스트
pnpm run serve:test
```

## ✅ 체크리스트

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

### 테스트

- [ ] E2E 테스트 통과
- [ ] 각 렌더링 모드별 테스트
- [ ] 성능 최적화

## 🎯 최종 목표

**완성 시점**: 모든 체크리스트 항목이 완료되고 E2E 테스트가 통과하는 상태

**성공 기준**:

- ✅ Express SSR 서버가 정상 동작
- ✅ Static Site Generation이 정상 동작
- ✅ 서버/클라이언트 데이터가 정상 공유
- ✅ E2E 테스트 통과
- ✅ 모든 빌드 스크립트 정상 동작
