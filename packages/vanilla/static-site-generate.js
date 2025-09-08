import fs from "node:fs";
import items from "./src/mocks/items.json" with { type: "json" };
import { createServer } from "vite";
import path from "node:path";
import { mswServer } from "./src/mocks/node.js";

mswServer.listen({
  onUnhandledRequest: "bypass",
});

const vite = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});

const { render } = await vite.ssrLoadModule("./src/main-server.js");

const joinDist = (...pathnames) => path.join("../../dist/vanilla", ...pathnames);

const template = fs.readFileSync(joinDist("/index.html"), "utf-8");

async function generateStaticSite(pathname, ssg) {
  const fullPathname = pathname.endsWith(".html") ? joinDist(pathname) : joinDist(pathname, "/index.html");
  const parsedPath = path.parse(fullPathname);

  const rendered = await render(pathname, {}, ssg);

  const html = template
    .replace(`<!--app-head-->`, rendered.head ?? "")
    .replace(`<!--app-html-->`, rendered.html ?? "")
    .replace(
      `<!-- app-data -->`,
      `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.__INITIAL_DATA__)};</script>`,
    );

  if (!fs.existsSync(parsedPath.dir)) {
    fs.mkdirSync(parsedPath.dir, { recursive: true });
  }

  fs.writeFileSync(fullPathname, html);
}

const getProducts = ({ category2 } = {}) => {
  const filterByCategory = (data) => {
    if (category2) {
      return data.filter((v) => v.category2 === category2);
    }
    return data;
  };

  const products = filterByCategory(items);

  return { products: products.sort((a, b) => +a.lprice - +b.lprice).slice(0, 20), totalCount: products.length };
};

// 404 생성
await generateStaticSite("/404.html");

// 홈 생성
await generateStaticSite("/");

// 상세페이지 생성
const { products } = getProducts();
for (const { productId } of products) {
  await generateStaticSite(`/product/${productId}/`);
}

vite.close();
