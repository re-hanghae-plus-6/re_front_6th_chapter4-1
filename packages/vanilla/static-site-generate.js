import fs from "fs";
import { createServer } from "vite";
const vite = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});

// Mock server setup for development
const { server } = await vite.ssrLoadModule("/src/mocks/serverBrowser.js");
server.listen();

const { getProducts } = await vite.ssrLoadModule("/src/api/productApi.js");

const { renderPage } = await vite.ssrLoadModule("/src/lib/serverRouter.js");

async function generateStaticSite(url, query) {
  // HTML 템플릿 읽기
  const template = fs.readFileSync("../../dist/vanilla/index.html", "utf-8");

  const rendered = await renderPage(url, query);

  const html = template
    .replace(`<!--app-head-->`, rendered.head ?? "")
    .replace(`<!--app-html-->`, rendered.html ?? "")
    .replace(
      `</head>`,
      `
        <script>
          window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialData || {})};
        </script>
        </head>
      `,
    );

  if (url == "/404") {
    fs.writeFileSync("../../dist/vanilla/404.html", html);
  } else {
    if (!fs.existsSync(`../../dist/vanilla${url}`)) {
      fs.mkdirSync(`../../dist/vanilla${url}`, { recursive: true });
    }
    fs.writeFileSync(`../../dist/vanilla${url}/index.html`, html);
  }
}

const { products } = await getProducts();

// 실행
generateStaticSite("/", {});
generateStaticSite("/404", {});
for (let i = 0; i < products.length; i++) {
  generateStaticSite(`/product/${products[i].productId}`, {});
}

vite.close();
