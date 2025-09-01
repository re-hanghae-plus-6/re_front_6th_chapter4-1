import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createServer as createViteServer } from "vite";

import { safeSerialize } from "./src/utils/safeSerialize.js";
import { server } from "./src/mocks/server.js";

import { getProducts } from "./src/api/productApi.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, "../../dist/vanilla");
const SSR_DIR = path.resolve(__dirname, "./dist/vanilla-ssr");

server.listen({
  onUnhandledRequest: "bypass",
});

async function loadRender() {
  const builtEntry = path.join(SSR_DIR, "entry-server.js");
  if (fs.existsSync(builtEntry)) {
    const mod = await import(pathToFileURL(builtEntry).href);
    if (typeof mod.render !== "function") throw new Error("SSR 모듈에 render가 없습니다.");
    return mod.render;
  }

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
  });
  try {
    const mod = await vite.ssrLoadModule("/src/entry-server.js");
    if (typeof mod.render !== "function") throw new Error("SSR 모듈에 render가 없습니다.");
    // vite 인스턴스는 이후 사용 계획이 없으므로 바로 닫음
    await vite.close();
    return mod.render;
  } catch (e) {
    await vite.close();
    throw e;
  }
}

async function getPages() {
  const { products } = await getProducts();

  return [
    { url: "/", filePath: path.join(DIST_DIR, "index.html") },
    // 404.html은 존재하지 않는 상품 상세 경로를 렌더해 notFound 데이터를 생성하여 저장
    { url: "/product/__notfound__/", filePath: path.join(DIST_DIR, "404.html"), is404: true },
    ...products.map((p) => ({
      url: `/product/${p.productId}/`,
      filePath: path.join(DIST_DIR, "product", String(p.productId), "index.html"),
    })),
  ];
}

async function ensureDir(filePath) {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
}

async function generateStaticSite() {
  const templatePath = path.join(DIST_DIR, "index.html");
  const template = await fsp.readFile(templatePath, "utf-8");

  const render = await loadRender();
  const pages = await getPages();

  for (const page of pages) {
    const { head = "", html = "", initialDataScript = "" } = await render(page.url);

    const appHtml = template
      .replace("<!--app-head-->", head)
      .replace("<!--app-html-->", html)
      .replace(
        "</head>",
        `${initialDataScript || `<script>window.__INITIAL_DATA__ = ${safeSerialize({})};</script>`}</head>`,
      );

    await ensureDir(page.filePath);
    await fsp.writeFile(page.filePath, appHtml);
  }
}

generateStaticSite().catch((err) => {
  console.error("SSG 생성 중 오류", err);
  process.exit(1);
});
