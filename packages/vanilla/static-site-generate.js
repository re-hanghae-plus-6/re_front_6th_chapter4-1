import fs from "fs";
import path from "path";
import { mockGetProducts } from "./src/mocks/mockApi.js";

function getDistRoot() {
  return path.resolve(process.cwd(), "../../dist/vanilla");
}

function saveHtmlFile(filePath, html) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, html, "utf-8");
}

async function generateStaticSite() {
  const distRoot = getDistRoot();
  const templatePath = `${distRoot}/index.html`;
  const template = fs.readFileSync(templatePath, "utf-8");
  const { render } = await import("./dist/vanilla-ssr/main-server.js");

  const pages = await getPages();
  await Promise.all(
    pages.map(async (page) => {
      const rendered = await render(page.url);
      const appHead = rendered?.head ?? "";
      const appHtml = rendered?.html ?? "";
      const initialDataScript = rendered?.initialData
        ? `<script>window.__INITIAL_DATA__=${JSON.stringify(rendered.initialData)}</script>`
        : "";

      const html = template
        .replace("<!--app-head-->", appHead)
        .replace("<!--app-html-->", appHtml)
        .replace("</head>", `${initialDataScript}</head>`);

      saveHtmlFile(page.filePath, html);
    }),
  );
}

await generateStaticSite();

async function getPages() {
  const distRoot = getDistRoot();
  const { products } = await mockGetProducts({ page: 1, limit: 20, sort: "price_asc" });

  return [
    { url: "/", filePath: `${distRoot}/index.html` },
    { url: "/404", filePath: `${distRoot}/404.html` },
    ...products.map((p) => ({
      url: `/product/${p.productId}`,
      filePath: `${distRoot}/product/${p.productId}/index.html`,
    })),
  ];
}
