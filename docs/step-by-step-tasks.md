# 단계별 구현 태스크 목록

## 🎯 사용자가 수행할 세부 태스크

### **1단계: Express SSR 서버 구축**

#### **Task 1.1: server.js 기본 설정**

- [ ] `packages/vanilla/server.js` 파일 열기
- [ ] 필요한 모듈 import 추가:
  ```javascript
  import express from "express";
  import fs from "fs";
  import { fileURLToPath } from "url";
  import { dirname, join } from "path";
  import sirv from "sirv";
  import compression from "compression";
  ```
- [ ] ES 모듈용 `__dirname` 설정:
  ```javascript
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  ```
- [ ] 환경 변수 설정:
  ```javascript
  const prod = process.env.NODE_ENV === "production";
  const port = process.env.PORT || 5173;
  const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");
  ```

#### **Task 1.2: 미들웨어 설정**

- [ ] Express 앱 생성: `const app = express();`
- [ ] 압축 미들웨어 추가: `app.use(compression());`
- [ ] 정적 파일 서빙 설정:
  ```javascript
  if (prod) {
    app.use(base, sirv("dist/vanilla", { dev: false }));
  } else {
    const { createServer } = await import("vite");
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);
  }
  ```

#### **Task 1.3: 서버 렌더링 함수**

- [ ] 기존 `render` 함수를 async 함수로 변경:
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

#### **Task 1.4: 라우트 처리 미들웨어**

- [ ] 기존 `app.get("*all")`을 `app.use("*")`로 변경
- [ ] 미들웨어 함수를 async로 변경:

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

#### **Task 1.5: 서버 시작**

- [ ] 서버 시작 로그 수정:
  ```javascript
  app.listen(port, () => {
    console.log(`Vanilla SSR Server started at http://localhost:${port}`);
  });
  ```

### **2단계: 서버 렌더링 엔진 구현**

#### **Task 2.1: main-server.js 기본 구조**

- [ ] `packages/vanilla/src/main-server.js` 파일 열기
- [ ] 필요한 모듈 import 추가:
  ```javascript
  import { productStore } from "./stores/productStore.js";
  import { cartStore } from "./stores/cartStore.js";
  import { uiStore } from "./stores/uiStore.js";
  import { getProducts, getProduct } from "./api/productApi.js";
  import { render as clientRender } from "./render.js";
  ```

#### **Task 2.2: ServerRouter 클래스 구현**

- [ ] ServerRouter 클래스 추가:

  ```javascript
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

#### **Task 2.3: 라우트 등록**

- [ ] 서버 라우터 인스턴스 생성: `const serverRouter = new ServerRouter();`
- [ ] 홈페이지 라우트 등록:
  ```javascript
  serverRouter.addRoute("/", async () => {
    const products = await getProducts({ limit: 20 });
    productStore.dispatch({ type: "SETUP", payload: products });
    return { page: "home" };
  });
  ```
- [ ] 상품 상세 라우트 등록:
  ```javascript
  serverRouter.addRoute("/product/:id/", async (params) => {
    const product = await getProduct(params.id);
    productStore.dispatch({ type: "SET_CURRENT_PRODUCT", payload: product });
    return { page: "product", product };
  });
  ```
- [ ] 404 라우트 등록:
  ```javascript
  serverRouter.addRoute("/404", async () => {
    return { page: "404" };
  });
  ```

#### **Task 2.4: 데이터 프리페칭 함수**

- [ ] prefetchData 함수 추가:

  ```javascript
  async function prefetchData(route, params) {
    if (!route) return;

    try {
      const result = await route.handler(params);
      return result;
    } catch (error) {
      console.error("Prefetch error:", error);
      return { page: "error" };
    }
  }
  ```

#### **Task 2.5: 메인 render 함수 구현**

- [ ] 기존 render 함수를 완전히 교체:

  ```javascript
  export async function render(url) {
    try {
      // 스토어 초기화
      productStore.dispatch({ type: "RESET" });
      cartStore.dispatch({ type: "RESET" });
      uiStore.dispatch({ type: "RESET" });

      // 라우트 매칭
      const route = serverRouter.findRoute(url);

      if (!route) {
        // 404 처리
        const notFoundRoute = serverRouter.findRoute("/404");
        const result = await prefetchData(notFoundRoute, {});
        const html = await clientRender();
        return { html, head: "", initialData: {} };
      }

      // 데이터 프리페칭
      const result = await prefetchData(route, route.params);

      // HTML 렌더링
      const html = await clientRender();

      // 초기 데이터 준비
      const initialData = {
        products: productStore.getState().products,
        currentProduct: productStore.getState().currentProduct,
        cart: cartStore.getState(),
        ui: uiStore.getState(),
      };

      return { html, head: "", initialData };
    } catch (error) {
      console.error("Server render error:", error);
      return {
        html: "<div>Server Error</div>",
        head: "",
        initialData: {},
      };
    }
  }
  ```

### **3단계: 클라이언트 하이드레이션**

#### **Task 3.1: main.js 하이드레이션 추가**

- [ ] `packages/vanilla/src/main.js` 파일 열기
- [ ] 스토어 import 추가:
  ```javascript
  import { productStore } from "./stores/productStore.js";
  import { cartStore } from "./stores/cartStore.js";
  import { uiStore } from "./stores/uiStore.js";
  ```

#### **Task 3.2: 하이드레이션 함수 구현**

- [ ] hydrateFromServer 함수 추가:

  ```javascript
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

#### **Task 3.3: main 함수 수정**

- [ ] main 함수 시작 부분에 하이드레이션 호출 추가:

  ```javascript
  function main() {
    // 서버 데이터 복원
    hydrateFromServer();

    registerAllEvents();
    registerGlobalEvents();
    loadCartFromStorage();
    initRender();
    router.start();
  }
  ```

### **4단계: Static Site Generation**

#### **Task 4.1: static-site-generate.js 기본 설정**

- [ ] `packages/vanilla/static-site-generate.js` 파일 열기
- [ ] 필요한 모듈 import 추가:
  ```javascript
  import fs from "fs";
  import { fileURLToPath } from "url";
  import { dirname, join } from "path";
  import { getProducts } from "./src/api/productApi.js";
  ```
- [ ] 경로 설정:

  ```javascript
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);

  const DIST_DIR = join(__dirname, "../../dist/vanilla");
  const SSR_DIR = join(__dirname, "dist/vanilla-ssr");
  ```

#### **Task 4.2: 페이지 목록 생성 함수**

- [ ] getPages 함수 추가:

  ```javascript
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
  ```

#### **Task 4.3: 유틸리티 함수들**

- [ ] 디렉토리 생성 함수:
  ```javascript
  function ensureDirectoryExists(filePath) {
    const dir = dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
  ```
- [ ] HTML 파일 저장 함수:
  ```javascript
  async function saveHtmlFile(filePath, html) {
    ensureDirectoryExists(filePath);
    fs.writeFileSync(filePath, html, "utf-8");
    console.log(`Generated: ${filePath}`);
  }
  ```

#### **Task 4.4: 메인 SSG 함수**

- [ ] generateStaticSite 함수 완전 교체:

  ```javascript
  async function generateStaticSite() {
    try {
      console.log("Starting Static Site Generation...");

      // HTML 템플릿 읽기
      const templatePath = join(DIST_DIR, "index.html");
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template not found: ${templatePath}`);
      }

      const template = fs.readFileSync(templatePath, "utf-8");

      // SSR 모듈 로드
      const { render } = await import(join(SSR_DIR, "main-server.js"));

      // 페이지 목록 생성
      const pages = await getPages();
      console.log(`Found ${pages.length} pages to generate`);

      // 각 페이지 렌더링 및 저장
      for (const page of pages) {
        try {
          console.log(`Generating: ${page.url}`);

          // 서버 렌더링 실행
          const { html, head, initialData } = await render(page.url);

          // 초기 데이터 스크립트 생성
          const initialDataScript = initialData
            ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};</script>`
            : "";

          // 최종 HTML 생성
          const finalHtml = template
            .replace("<!--app-head-->", head || "")
            .replace("<!--app-html-->", html || "")
            .replace("</head>", `${initialDataScript}</head>`);

          // 파일 저장
          await saveHtmlFile(page.filePath, finalHtml);
        } catch (error) {
          console.error(`Error generating ${page.url}:`, error);
        }
      }

      console.log("Static Site Generation completed!");
    } catch (error) {
      console.error("SSG Error:", error);
      process.exit(1);
    }
  }
  ```

### **5단계: 테스트 및 검증**

#### **Task 5.1: 빌드 테스트**

- [ ] 터미널에서 `cd packages/vanilla` 실행
- [ ] 클라이언트 빌드: `pnpm run build:client`
- [ ] 서버 빌드: `pnpm run build:server`
- [ ] 통합 빌드: `pnpm run build:without-ssg`

#### **Task 5.2: 서버 실행 테스트**

- [ ] SSR 개발 서버: `pnpm run dev:ssr`
- [ ] 브라우저에서 `http://localhost:5174` 접속
- [ ] 홈페이지와 상품 상세 페이지 테스트

#### **Task 5.3: SSG 테스트**

- [ ] SSG 빌드: `pnpm run build:ssg`
- [ ] SSG 서버: `pnpm run preview:ssg`
- [ ] 브라우저에서 `http://localhost:4178` 접속

#### **Task 5.4: E2E 테스트**

- [ ] 기본 테스트: `pnpm run test:e2e:basic`
- [ ] UI 테스트: `pnpm run test:e2e:ui`
- [ ] 테스트 실패 시 디버깅 및 수정

## 🚨 주의사항

### **빌드 순서**

1. **클라이언트 빌드** 먼저 실행
2. **서버 빌드** 그 다음 실행
3. **SSG 빌드** 마지막에 실행

### **에러 처리**

- 각 단계에서 에러 발생 시 콘솔 로그 확인
- import 경로가 올바른지 확인
- 파일 경로가 올바른지 확인

### **테스트 순서**

1. **개발 서버** 먼저 테스트
2. **프로덕션 서버** 그 다음 테스트
3. **SSG 서버** 마지막에 테스트

## ✅ 완료 체크리스트

### **1단계 완료 조건**

- [ ] `pnpm run dev:ssr` 실행 시 서버가 정상 시작
- [ ] 브라우저에서 홈페이지 접속 시 정상 렌더링
- [ ] 콘솔에 에러가 없음

### **2단계 완료 조건**

- [ ] `pnpm run build:server` 빌드 성공
- [ ] 서버에서 상품 목록 데이터 로드
- [ ] 서버에서 상품 상세 데이터 로드

### **3단계 완료 조건**

- [ ] 클라이언트에서 서버 데이터 복원
- [ ] 페이지 새로고침 후에도 상태 유지
- [ ] 하이드레이션 후 클라이언트 기능 정상 동작

### **4단계 완료 조건**

- [ ] `pnpm run build:ssg` 빌드 성공
- [ ] 정적 HTML 파일들이 생성됨
- [ ] SSG 서버에서 정적 파일 서빙

### **5단계 완료 조건**

- [ ] 모든 빌드 스크립트 정상 동작
- [ ] E2E 테스트 통과
- [ ] 모든 렌더링 모드 정상 동작
