## 목적
이 문서는 Gemini CLI가 **기본 과제(SSR & SSG)**를 오류 없이 수행하기 위해 따라야 할 지침서입니다.  
Gemini는 반드시 아래의 체크포인트를 충족하고, 브라우저에서 정상적으로 동작하는 결과물을 생성해야 합니다.  
최종 목표는 **오류 없는 빌드 + 실행 + 브라우저 렌더링 확인**입니다.

## 과제 체크포인트

### 기본과제 (Vanilla SSR & SSG)

#### Express SSR 서버
- [ ] Express 미들웨어 기반 서버 구현
- [ ] 개발/프로덕션 환경 분기 처리
- [ ] HTML 템플릿 치환 (`<!--app-html-->`, `<!--app-head-->`)

#### 서버 사이드 렌더링
- [ ] 서버에서 동작하는 Router 구현
- [ ] 서버 데이터 프리페칭 (상품 목록, 상품 상세)
- [ ] 서버 상태관리 초기화

#### 클라이언트 Hydration
- [ ] `window.__INITIAL_DATA__` 스크립트 주입
- [ ] 클라이언트 상태 복원
- [ ] 서버-클라이언트 데이터 일치

#### Static Site Generation
- [ ] 동적 라우트 SSG (상품 상세 페이지들)
- [ ] 빌드 타임 페이지 생성
- [ ] 파일 시스템 기반 배포

## (2) 기본 과제 구현 가이드

### 1) Express 서버 (`./packages/vanilla/server.js`)

**핵심 키워드:** middleware, template, render, hydration

```jsx
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

### 2) 서버 렌더링 (`./packages/vanilla/src/main-server.js`)

**핵심 키워드:** routing, prefetch, store, params

```jsx
class ServerRouter {
  addRoute(path, handler) {
    // :id → (\\\\d+) 정규식 변환
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

### 3) SSG (`./packages/vanilla/static-site-generate.js`)

**핵심 키워드:** build-time, dynamic routes, file generation

```jsx
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

### 4) Hydration (`./packages/src/main.js`)

**핵심 키워드:** client-side, initial data, store sync

```jsx
// 서버 데이터 복원
if (window.__INITIAL_DATA__) {
  const data = window.__INITIAL_DATA__;
  if (data.products) productStore.dispatch(PRODUCT_ACTIONS.SETUP, data);
  if (data.currentProduct) productStore.dispatch(PRODUCT_ACTIONS.SET_CURRENT_PRODUCT, data);
  delete window.__INITIAL_DATA__;
}

render(); // 클라이언트 렌더링 시작
```

## (3) 테스트 통과하기

```bash
$ pnpm run test:e2e:basic
```

## (4) Gemini 실행 지침
- Gemini는 코드를 작성할 때 **체크포인트를 모두 충족**해야 합니다.  
- **실패 허용 불가 조건**:
  1. 서버 실행 시 에러 발생  
  2. 빌드 후 정적 페이지 누락  
  3. 브라우저 Hydration mismatch 경고  
- Gemini는 각 단계마다 **“실행 기준을 만족하는지” 반드시 확인**해야 합니다.