import fs from "fs";
import { dirname, join } from "path";
import { createServer } from "vite";

const vite = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});

const { mswServer } = await vite.ssrLoadModule("./src/mocks/node.ts");

mswServer.listen({
  onUnhandledRequest: "bypass",
});

const DIST_DIR = "../../dist/react";

async function generateStaticSite() {
  const { render } = await vite.ssrLoadModule("./src/main-server.js");
  const pages = await getPages();

  for (const page of pages) {
    const { html, head, initialData } = await render(page.url);

    const template = fs.readFileSync(`./dist/react/index.html`, "utf-8");

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

  mswServer.close();
  vite.close();
}

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
