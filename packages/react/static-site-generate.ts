import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { createServer as createViteServer } from "vite";
import { server } from "./src/mocks/server";

import { getProducts } from "./src/api/productApi";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, "../../dist/react");
const SSR_DIR = path.resolve(__dirname, "./dist/react-ssr");

server.listen({
  onUnhandledRequest: "bypass",
});

async function loadRender() {
  const builtEntry = path.join(SSR_DIR, "entry-server.tsx");
  if (fs.existsSync(builtEntry)) {
    const mod = await import(pathToFileURL(builtEntry).href);
    if (typeof mod.render !== "function") throw new Error("SSR 모듈에 render가 없습니다.");
    return { render: mod.render, vite: null };
  }

  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
  });
  try {
    const mod = await vite.ssrLoadModule("/src/entry-server.tsx");

    if (typeof mod.render !== "function") throw new Error("SSR 모듈에 render가 없습니다.");
    // Vite 인스턴스를 반환하여 나중에 닫을 수 있도록 함
    return { render: mod.render, vite };
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

  const { render, vite } = await loadRender();
  const pages = await getPages();

  try {
    for (const page of pages) {
      const { head = "", html = "", initialDataScript = "" } = await render(page.url);

      const appHtml = template
        .replace("<!--app-head-->", head)
        .replace("<!--app-html-->", html)
        .replace("</head>", `${initialDataScript}</head>`);

      await ensureDir(page.filePath);
      await fsp.writeFile(page.filePath, appHtml);
    }
  } catch (error) {
    console.log(error);
  } finally {
    // 모든 렌더링 작업이 완료된 후 Vite 인스턴스를 닫음
    if (vite) {
      await vite.close();
    }
  }
}

generateStaticSite().catch((err) => {
  console.error("SSG 생성 중 오류", err);
  process.exit(1);
});
