import fs from "fs";
import { dirname, join } from "path";
import { createServer } from "vite";
import { mswServer } from "./src/mocks/node.js";

// MSW 서버 설정
mswServer.listen({
  onUnhandledRequest: "bypass",
});

// Vite 서버 설정
const vite = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});

const DIST_DIR = "../../dist/vanilla";

async function generateStaticSite() {
  // 어플리케이션 렌더링하기
  const { render } = await vite.ssrLoadModule("./src/main-server.js");
  const pages = await getPages();

  for (const page of pages) {
    const { html, head, initialData } = await render(page.url);

    const template = fs.readFileSync(`./dist/vanilla/index.html`, "utf-8");

    const initialDataScript = initialData
      ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};</script>`
      : "";

    const finalHtml = template
      .replace("<!--app-html-->", html)
      .replace("<!--app-head-->", head)
      .replace("</head>", `${initialDataScript}</head>`);

    // 디렉토리가 없으면 생성
    const pageDir = dirname(page.filePath);
    if (!fs.existsSync(pageDir)) {
      fs.mkdirSync(pageDir, { recursive: true });
    }

    fs.writeFileSync(page.filePath, finalHtml);
  }

  // MSW 서버 종료
  mswServer.close();
  vite.close();
}

// 실행
generateStaticSite();

async function getPages() {
  const { getProducts } = await vite.ssrLoadModule("./src/api/productApi.js");
  const { products } = await getProducts();

  return [
    { url: "/", filePath: join(DIST_DIR, "index.html") },
    { url: "/404", filePath: join(DIST_DIR, "404.html") },
    ...products.map((product) => ({
      url: `/product/${product.productId}/`,
      filePath: join(DIST_DIR, `product/${product.productId}/index.html`),
    })),
  ];
}
