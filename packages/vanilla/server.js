import express from "express";
import fs from "node:fs/promises";

// 환경 변수 및 상수 설정
const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174; // SSR 포트
const base = process.env.BASE || (isProduction ? "/front_6th_chapter4-1/vanilla/" : "/");

// Express 앱 생성
const app = express();

// 템플릿과 렌더 함수 변수
let template;
let render;
let vite;

// API 라우트 추가
app.use(express.json());

// 상품 상세 API
app.get("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("📡 API 요청 - 상품 상세:", id);

    // items.json 로드
    const items = JSON.parse(await fs.readFile("./src/mocks/items.json", "utf-8"));

    const product = items.find((item) => String(item.productId) === String(id));

    if (!product) {
      console.log("❌ API - 상품을 찾을 수 없음:", id);
      return res.status(404).json({ error: "Product not found" });
    }

    // 상세 정보에 추가 데이터 포함
    const detailProduct = {
      ...product,
      description: `${product.title}에 대한 상세 설명입니다. ${product.brand} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
      rating: Math.floor(Math.random() * 2) + 4,
      reviewCount: Math.floor(Math.random() * 1000) + 50,
      stock: Math.floor(Math.random() * 100) + 10,
      images: [product.image, product.image.replace(".jpg", "_2.jpg"), product.image.replace(".jpg", "_3.jpg")],
    };

    console.log("✅ API - 상품 응답 성공:", product.title);
    res.json(detailProduct);
  } catch (error) {
    console.error("❌ API 에러:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 상품 목록 API
app.get("/api/products", async (req, res) => {
  try {
    console.log("📡 API 요청 - 상품 목록");

    // 동적 import로 서버 함수 로드
    const serverModule = await import("./src/mocks/server.js");
    const result = serverModule.getProductsOnServer(req.query);

    console.log("✅ API - 상품 목록 응답 성공");
    res.json(result);
  } catch (error) {
    console.error("❌ API 에러:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 카테고리 API
app.get("/api/categories", async (req, res) => {
  try {
    console.log("📡 API 요청 - 카테고리");

    // 동적 import로 서버 함수 로드
    const serverModule = await import("./src/mocks/server.js");
    const categories = serverModule.getUniqueCategories();

    console.log("✅ API - 카테고리 응답 성공");
    res.json(categories);
  } catch (error) {
    console.error("❌ API 에러:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 프로덕션 환경에서 base 경로를 포함한 API 라우트도 추가
if (isProduction && base !== "/") {
  app.get(`${base}api/products/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      console.log("📡 API 요청 - 상품 상세 (base 경로):", id);

      // items.json 로드
      const items = JSON.parse(await fs.readFile("./src/mocks/items.json", "utf-8"));

      const product = items.find((item) => String(item.productId) === String(id));

      if (!product) {
        console.log("❌ API - 상품을 찾을 수 없음:", id);
        return res.status(404).json({ error: "Product not found" });
      }

      // 상세 정보에 추가 데이터 포함
      const detailProduct = {
        ...product,
        description: `${product.title}에 대한 상세 설명입니다. ${product.brand} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
        rating: Math.floor(Math.random() * 2) + 4,
        reviewCount: Math.floor(Math.random() * 1000) + 50,
        stock: Math.floor(Math.random() * 100) + 10,
        images: [product.image, product.image.replace(".jpg", "_2.jpg"), product.image.replace(".jpg", "_3.jpg")],
      };

      console.log("✅ API - 상품 응답 성공 (base 경로):", product.title);
      res.json(detailProduct);
    } catch (error) {
      console.error("❌ API 에러 (base 경로):", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get(`${base}api/products`, async (req, res) => {
    try {
      console.log("📡 API 요청 - 상품 목록 (base 경로)");

      // 동적 import로 서버 함수 로드
      const serverModule = await import("./src/mocks/server.js");
      const result = serverModule.getProductsOnServer(req.query);

      console.log("✅ API - 상품 목록 응답 성공 (base 경로)");
      res.json(result);
    } catch (error) {
      console.error("❌ API 에러 (base 경로):", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get(`${base}api/categories`, async (req, res) => {
    try {
      console.log("📡 API 요청 - 카테고리 (base 경로)");

      // 동적 import로 서버 함수 로드
      const serverModule = await import("./src/mocks/server.js");
      const categories = serverModule.getUniqueCategories();

      console.log("✅ API - 카테고리 응답 성공 (base 경로)");
      res.json(categories);
    } catch (error) {
      console.error("❌ API 에러 (base 경로):", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}

// 환경별 설정
if (!isProduction) {
  // 개발 환경: Vite 개발 서버 연동
  console.log("🛠️ 개발 환경 - Vite 설정 중...");
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });
  app.use(vite.middlewares);
} else {
  // 프로덕션 환경: 압축 및 정적 파일 서빙
  console.log("🏭 프로덕션 미들웨어 설정 중...");
  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;
  app.use(compression());
  app.use(base, sirv("./dist/vanilla", { extensions: [] }));

  // 프로덕션 템플릿 로드
  template = await fs.readFile("./dist/vanilla/index.html", "utf-8");
  render = (await import("./dist/vanilla-ssr/main-server.js")).render;
}

// SSR 렌더링 미들웨어
app.use(/^(?!.*\/api).*$/, async (req, res) => {
  try {
    // URL에서 베이스 경로 제거 (정규화)
    let normalizedUrl = req.originalUrl;

    // 프로덕션 환경에서 base 경로가 포함된 경우에만 제거
    if (isProduction && base !== "/" && normalizedUrl.startsWith(base)) {
      normalizedUrl = normalizedUrl.replace(base, "");
    } else if (!isProduction && base === "/") {
      // 개발 환경에서는 그대로 사용
      normalizedUrl = req.originalUrl;
    }

    // 빈 문자열이거나 슬래시로 시작하지 않는 경우 처리
    if (!normalizedUrl || !normalizedUrl.startsWith("/")) {
      normalizedUrl = "/" + (normalizedUrl || "");
    }
    // 연속된 슬래시 제거
    const url = normalizedUrl.replace(/\/+/g, "/");
    console.log("🌐 SSR 요청:", req.originalUrl, "-> 정규화됨:", url);

    if (!isProduction) {
      // 개발 환경: 매 요청마다 최신 템플릿과 렌더 함수 로드
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.js")).render;
    }

    const rendered = await render(url, req.query);

    // 초기 데이터 스크립트 생성 (Hydration용)
    const initialDataScript = rendered.initialData
      ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialData)}</script>`
      : "";

    // HTML 템플릿에 렌더링 결과 주입
    const html = template
      .replace("<!--app-head-->", rendered.head ?? "")
      .replace("<!--app-html-->", rendered.html ?? "")
      .replace("</head>", `${initialDataScript}</head>`);

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (error) {
    // 개발 환경에서 스택 트레이스 정리
    if (!isProduction && vite) {
      vite.ssrFixStacktrace(error);
    }

    console.error("❌ SSR 에러:", error.stack);
    res.status(500).end(error.stack);
  }
});

// HTTP 서버 시작
app.listen(port, () => {
  console.log(`🌐 SSR 서버가 http://localhost:${port} 에서 실행 중입니다`);
});
