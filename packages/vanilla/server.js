import express from "express";
import fs from "fs";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

const app = express();

const templateHtml = prod ? fs.readFileSync("./dist/vanilla-ssr/index.html", "utf-8") : "";

let vite;
if (!prod) {
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
  app.use(base, sirv("./dist/vanilla", { extensions: [] }));
}

app.use("*all", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");

    let template;
    let render;
    if (!prod) {
      template = fs.readFileSync("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("./src/main-server.js")).render;
    } else {
      template = templateHtml;
      render = (await import("./dist/vanilla-ssr/main-server.js")).render;
    }

    // URL에서 쿼리 파라미터 파싱
    const urlObj = new URL(url, `http://localhost:${port}`);
    const query = {};
    for (const [key, value] of urlObj.searchParams) {
      query[key] = value;
    }

    // 서버에서 필요한 데이터 미리 로드
    const initialData = {
      products: [],
      categories: {},
      totalCount: 0,
      loading: false,
      error: null,
      currentProduct: null,
      relatedProducts: [],
    };

    try {
      // 기존 API 함수들 import (서버에서도 작동하도록 수정된 버전)
      const { getProducts, getCategories, getProduct } = await vite.ssrLoadModule("./src/api/productApi.js");

      // URL에 따라 다른 데이터 로드
      if (url === "" || url === "/" || url.startsWith("/?")) {
        // 홈페이지: 상품 목록과 카테고리 로드
        const [productsData, categoriesData] = await Promise.all([getProducts(query), getCategories()]);

        initialData.products = productsData.products;
        initialData.categories = categoriesData;
        initialData.totalCount = productsData.pagination.total;
      } else if (url.match(/^\/product\/([^/]+)\/?$/)) {
        // 상품 상세 페이지: 상품 상세와 관련 상품 로드
        const productId = url.match(/^\/product\/([^/]+)\/?$/)[1];

        const product = await getProduct(productId);
        initialData.currentProduct = product;

        // 관련 상품 로드 (같은 category2)
        if (product.category2) {
          const relatedData = await getProducts({
            category2: product.category2,
            limit: 20,
          });
          initialData.relatedProducts = relatedData.products.filter((p) => p.productId !== productId);
        }

        const categoriesData = await getCategories();
        initialData.categories = categoriesData;
      }
    } catch (error) {
      console.error("서버 데이터 로드 실패:", error);
      initialData.error = error.message;
    }

    const rendered = await render(url, query, initialData);

    // 초기 데이터를 HTML에 주입
    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? "")
      .replace(`<!--app-html-->`, rendered.html ?? "")
      .replace(
        `</head>`,
        `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData).replace(/</g, "\\u003c")}</script></head>`,
      );

    res.status(200).set({ "Content-Type": "text/html" }).end(html);
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    console.log(e.stack);
    res.status(500).end(e.stack);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`SSR Server started at http://localhost:${port}`);
});
