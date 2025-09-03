import express from "express";
import compression from "compression";
import sirv from "sirv";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

// HTML 템플릿 로드 및 분할
const template = readFileSync(join(__dirname, "index.html"), "utf-8");

const app = express();

// MSW Mock Server 시작
const { startMockServer } = await import("./src/mocks/setupServer.js");
startMockServer();

// Express 미들웨어 설정
app.use(compression());
app.use(express.static("public"));

// 환경 분기
if (!prod) {
  // 개발 환경: Vite dev server
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  // Vite의 미들웨어 사용
  app.use(vite.middlewares);

  // Vite 인스턴스를 res.locals에 저장
  app.use((req, res, next) => {
    res.locals.vite = vite;
    next();
  });
} else {
  // 프로덕션 환경: sirv로 정적 파일 서빙
  app.use(base, sirv("dist/vanilla", { extensions: [] }));
}

// 서버용 API 호출 함수들
async function getProducts(params = {}) {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.set(key, String(value));
    }
  });

  const response = await fetch(`http://localhost/api/products?${searchParams}`);
  return await response.json();
}

async function getProduct(productId) {
  const response = await fetch(`http://localhost/api/products/${productId}`);
  return await response.json();
}

async function getCategories() {
  const response = await fetch("http://localhost/api/categories");
  return await response.json();
}

// 라우트별 데이터 프리페칭
const prefetchData = async (route, params, query) => {
  try {
    switch (route.path) {
      case "/":
        // 홈페이지: 상품 목록 + 카테고리
        console.log("홈페이지 데이터 프리페칭 시작", query);
        // eslint-disable-next-line no-case-declarations
        const [productsResponse, categories] = await Promise.all([getProducts(query), getCategories()]);
        return {
          products: productsResponse.products,
          totalCount: productsResponse.pagination.total,
          categories,
          currentProduct: null,
          relatedProducts: [],
        };

      case "/product/:id/":
        // 상품 상세: 상품 정보 + 관련 상품
        console.log("상품 상세 데이터 프리페칭 시작", params.id);
        // eslint-disable-next-line no-case-declarations
        const product = await getProduct(params.id);

        // 관련 상품 로드 (같은 category2)
        // eslint-disable-next-line no-case-declarations
        let relatedProducts = [];
        if (product.category2) {
          const relatedResponse = await getProducts({
            category2: product.category2,
            limit: 20,
          });
          relatedProducts = relatedResponse.products.filter((p) => p.productId !== product.productId);
        }

        return {
          products: [],
          totalCount: 0,
          categories: {},
          currentProduct: product,
          relatedProducts,
        };

      default:
        return {
          products: [],
          totalCount: 0,
          categories: {},
          currentProduct: null,
          relatedProducts: [],
        };
    }
  } catch (error) {
    console.error("데이터 프리페칭 오류:", error);
    return {
      products: [],
      totalCount: 0,
      categories: {},
      currentProduct: null,
      relatedProducts: [],
    };
  }
};

// 서버사이드 렌더링을 위한 라우터 설정
const setupServerRoutes = async (url) => {
  const { ServerRouter } = await import("./src/lib/ServerRouter.js");

  const serverRouter = new ServerRouter(url, base);

  // 데이터를 포함한 렌더링 함수들
  const serverHomePage = (data) => {
    const { products, totalCount, categories } = data || {};
    return `
      <div>
        <h1>홈페이지 - 상품 목록 (SSR + MSW)</h1>
        <p>총 ${totalCount || 0}개 상품</p>
        <p>카테고리 수: ${categories ? Object.keys(categories).length : 0}개</p>
        <p>현재 페이지 상품: ${products ? products.length : 0}개</p>
        ${
          products && products.length > 0
            ? `
          <ul>
            ${products
              .slice(0, 5)
              .map((p) => `<li>${p.title} - ${Number(p.lprice).toLocaleString()}원</li>`)
              .join("")}
            ${products.length > 5 ? "<li>...</li>" : ""}
          </ul>
        `
            : "<p>상품이 없습니다.</p>"
        }
      </div>
    `;
  };

  const serverProductDetailPage = (data) => {
    const { currentProduct, relatedProducts } = data || {};
    if (!currentProduct) return `<div>상품을 찾을 수 없습니다.</div>`;

    return `
      <div>
        <h1>상품 상세 페이지 (SSR + MSW)</h1>
        <h2>${currentProduct.title}</h2>
        <p>가격: ${Number(currentProduct.lprice).toLocaleString()}원</p>
        <p>브랜드: ${currentProduct.brand}</p>
        <p>카테고리: ${currentProduct.category1} > ${currentProduct.category2}</p>
        ${relatedProducts && relatedProducts.length > 0 ? `<p>관련 상품: ${relatedProducts.length}개</p>` : ""}
      </div>
    `;
  };

  const serverNotFoundPage = () => `<div>페이지를 찾을 수 없습니다.</div>`;

  // 라우트 등록
  serverRouter.addRoute("/", serverHomePage);
  serverRouter.addRoute("/product/:id/", serverProductDetailPage);
  serverRouter.addRoute(".*", serverNotFoundPage);

  return serverRouter;
};

// 서버사이드 렌더링 함수
const renderPage = async (url) => {
  try {
    const serverRouter = await setupServerRoutes(url);
    const route = serverRouter.start();

    if (!route) {
      return `<div>페이지를 찾을 수 없습니다.</div>`;
    }

    // 데이터 프리페칭
    const initialData = await prefetchData(route, serverRouter.params, serverRouter.query);
    console.log("프리페칭된 데이터:", {
      route: route.path,
      params: serverRouter.params,
      query: serverRouter.query,
      dataKeys: Object.keys(initialData),
    });

    // 서버에서 컴포넌트 렌더링 (데이터와 함께)
    const PageComponent = route.handler;
    return PageComponent(initialData);
  } catch (error) {
    console.error("SSR 렌더링 오류:", error);
    return `<div>서버 렌더링 중 오류가 발생했습니다.</div>`;
  }
};

// 렌더링 파이프라인
app.use("*all", async (req, res) => {
  try {
    const url = req.originalUrl;

    let html = template;

    // 개발 환경에서 Vite transform 적용
    if (!prod) {
      const vite = res.locals.vite;
      if (vite) {
        html = await vite.transformIndexHtml(url, html);
      }
    }

    // 서버사이드 렌더링
    const appHtml = await renderPage(url);
    const appHead = `<title>Vanilla Javascript SSR</title>`;

    // Template 치환
    const finalHtml = html.replace("<!--app-head-->", appHead).replace("<!--app-html-->", appHtml);

    res.status(200).set({ "Content-Type": "text/html" }).end(finalHtml);
  } catch (e) {
    console.error(e.stack);
    res.status(500).end(e.stack);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
