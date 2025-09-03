import express from "express";
import fs from "fs";
import path from "path";
import { loadingProudcts, filterProducts } from "./src/utils/productUtils.js";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

const app = express();

const templateHtml = prod ? fs.readFileSync("./dist/vanilla/index.html", "utf-8") : "";

async function loadItemsFromDist() {
  const distDir = path.resolve(process.cwd(), "dist/vanilla-ssr/assets/");
  if (!fs.existsSync(distDir)) return [];

  const file = fs.readdirSync(distDir).find((f) => f.startsWith("items") && f.endsWith(".js"));
  if (!file) return [];

  const js = fs.readFileSync(path.join(distDir, file), "utf-8");
  const m = js.match(/items_default\s*=\s*.*?JSON\.parse\("([\s\S]+?)"\)/);
  if (!m) return [];

  const unescaped = m[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  return JSON.parse(unescaped);
}

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

    // 포트로 SSR/CSR 결정: 4173 → SSR, 5173 → CSR (그 외는 SSR)
    const hostHeader = req.headers.host || "";
    const reqPort = Number(hostHeader.split(":")[1] || (req.socket?.localPort ?? 0));
    const doSSR = !["5173", "4173"].includes(reqPort);

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
      // URL에 따라 다른 데이터 로드
      if (doSSR) {
        // 기존 API 함수들 import (서버에서도 작동하도록 수정된 버전)

        const splitUrl = url.split("/").filter((segment) => segment !== "");

        if (!prod) {
          const { getProducts, getCategories, getProduct } = await vite.ssrLoadModule("./src/api/productApi.js");

          if (splitUrl?.[0] === "product") {
            // 상품 상세 페이지: 상품 상세와 관련 상품 로드
            const productId = splitUrl[1];

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
          } else if (url === "" || url === "/" || url.startsWith("/?") || url.startsWith("?")) {
            // 홈페이지: 상품 목록과 카테고리 로드
            const [productsData, categoriesData] = await Promise.all([getProducts(query), getCategories()]);

            initialData.products = productsData.products;
            initialData.categories = categoriesData;
            initialData.totalCount = productsData.pagination.total;
          }
        } else {
          const items = await loadItemsFromDist(); // ← 이미 파일 상단에 추가한 헬퍼 함수

          const buildCategories = (arr) => {
            const cats = {};
            for (const it of arr) {
              if (!it.category1) continue;
              cats[it.category1] ??= {};
              if (it.category2) cats[it.category1][it.category2] ??= {};
            }
            return cats;
          };

          if (splitUrl?.[0] === "product") {
            const productId = splitUrl[1];
            const product = items.find((i) => String(i.productId) === String(productId)) || null;
            initialData.currentProduct = product;

            if (product?.category2) {
              initialData.relatedProducts = items
                .filter((i) => i.category2 === product.category2 && String(i.productId) !== String(productId))
                .slice(0, 20);
            }
            initialData.categories = buildCategories(items);
          } else if (url === "" || url === "/" || url.startsWith("?")) {
            // 홈: 테스트가 기대하는 초기 데이터
            const limit = Number(query.limit) > 0 ? Number(query.limit) : 20;
            const products = Object.keys(query).length === 0 ? loadingProudcts(items) : filterProducts(items, query);

            // 초기 데이터 채우기
            initialData.products = products.slice(0, limit);
            initialData.totalCount = products.length; // 340
            initialData.categories = buildCategories(items);
          }
        }
      }
    } catch (error) {
      console.error("서버 데이터 로드 실패:", error);
      initialData.error = error.message;
    }

    console.log(url);

    const rendered = doSSR ? await render(url, query, initialData, { doSSR }) : { head: "", html: "" };

    // 초기 데이터를 HTML에 주입
    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? "")
      .replace(`<!--app-html-->`, rendered.html ?? "")
      .replace(
        `</head>`,
        `<script>
           window.__INITIAL_DATA__=${JSON.stringify(initialData).replace(/</g, "\\u003c")};
           window.__RENDER_MODE__="${doSSR ? "ssr" : "csr"}";
         </script></head>`,
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
