import fs from "fs";
import path from "path";

function getDistRoot() {
  return path.resolve(process.cwd(), "../../dist/react");
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

  const { render } = await import("./dist/react-ssr/main-server.js");
  const pages = await getPages(render);

  await Promise.all(
    pages.map(async (page) => {
      const rendered = await render(page.url, page.query ?? {});
      const appHead = rendered?.head ?? "";
      const appHtml = rendered?.html ?? "";
      const initialDataScript = rendered?.initialData
        ? `<script>window.__INITIAL_DATA__=${JSON.stringify(rendered.initialData).replace(/</g, "\\u003c")}</script>`
        : "";

      const html = template
        .replace("<!--app-head-->", appHead)
        .replace("<!--app-html-->", appHtml)
        .replace("</head>", `${initialDataScript}</head>`);

      saveHtmlFile(page.filePath, html);
    }),
  );
}

// 실행
await generateStaticSite();

async function getPages(render) {
  const distRoot = getDistRoot();
  // 홈을 한 번 렌더링하여 상품 목록을 얻어 상세 페이지들을 구성
  const homeQuery = { page: 1, limit: 20, sort: "price_asc" };
  const home = await render("/", homeQuery);
  const products = home?.initialData?.products ?? [];

  return [
    { url: "/", filePath: `${distRoot}/index.html`, query: homeQuery },
    { url: "/404", filePath: `${distRoot}/404.html` },
    ...products.map((p) => ({
      url: `/product/${p.productId}`,
      filePath: `${distRoot}/product/${p.productId}/index.html`,
    })),
  ];
}
