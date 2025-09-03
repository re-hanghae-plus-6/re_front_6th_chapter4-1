import fs from "node:fs/promises";
import express from "express";

// Constants
const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || "/";

// Cached production assets
const templateHtml = isProduction ? await fs.readFile("./dist/client/index.html", "utf-8") : "";

// Create http server
const app = express();

// JSON 요청 본문을 파싱하는 미들웨어 추가
app.use(express.json());

// Add Vite or respective production middlewares
/** @type {import('vite').ViteDevServer | undefined} */
let vite;
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
  app.use(base, sirv("./dist/client", { extensions: [] }));
}

// API 라우트 - 간단한 목 데이터 제공
app.use("/api", async (req, res, next) => {
  try {
    if (req.path === "/products") {
      // 상품 목록 API
      const items = await import("./src/mocks/items.json", { with: { type: "json" } });
      const products = items.default || [];

      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;

      res.json({
        products: products.slice(startIndex, endIndex),
        pagination: {
          page,
          limit,
          total: products.length,
          totalPages: Math.ceil(products.length / limit),
        },
      });
      return;
    }

    if (req.path.startsWith("/products/")) {
      // 상품 상세 API
      const productId = req.path.split("/")[2];
      const items = await import("./src/mocks/items.json", { with: { type: "json" } });
      const products = items.default || [];
      const product = products.find((p) => p.productId === productId);

      if (product) {
        res.json({
          ...product,
          description: `${product.title}에 대한 상세 설명입니다.`,
          rating: 4.5,
          reviewCount: 123,
          stock: 50,
        });
      } else {
        res.status(404).json({ error: "Product not found" });
      }
      return;
    }

    if (req.path === "/categories") {
      // 카테고리 API
      const items = await import("./src/mocks/items.json", { with: { type: "json" } });
      const products = items.default || [];
      const categories = {};

      products.forEach((product) => {
        if (product.category1) {
          if (!categories[product.category1]) categories[product.category1] = {};
          if (product.category2) {
            categories[product.category1][product.category2] = {};
          }
        }
      });

      res.json(categories);
      return;
    }

    next();
  } catch (error) {
    console.error("API 라우트 오류:", error);
    next();
  }
});

// Serve HTML - 모든 라우트에 대해
app.use(async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");

    /** @type {string} */
    let template;
    /** @type {import('./src/main-server.js').render} */
    let render;
    if (!isProduction) {
      // Always read fresh template in development
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.js")).render;
    } else {
      template = templateHtml;
      render = (await import("./dist/server/main-server.js")).render;
    }

    const query = Object.fromEntries(new URLSearchParams(req.url.split("?")[1] || ""));
    const rendered = await render(url, query);

    // 초기 데이터 스크립트 생성
    const initialDataScript = `
      <script>
        window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialData || {})};
      </script>
    `;

    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? "")
      .replace(`<!--app-html-->`, rendered.html ?? "")
      .replace("</head>", `${initialDataScript}</head>`);

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    console.log(e.stack);
    res.status(500).end(e.stack);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`쇼핑몰 SSR 서버가 http://localhost:${port}에서 시작되었습니다`);
});
