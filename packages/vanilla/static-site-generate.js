import fs from "fs/promises";
import { mockServer } from "./src/mocks/server-mock.js";
import items from "./src/mocks/items.json" with { type: "json" };

// SSR 번들에서 render 불러오기 (먼저 build:server 필요)
const { render } = await import("./dist/vanilla-ssr/main-server.js");

const BASE = "/front_6th_chapter4-1/vanilla/";

async function writeRoute(url, template, outFile) {
  const { html, head, data } = await render(url, {});
  const result = template
    .replace(`<!--app-head-->`, head ?? "")
    .replace(`<!--app-data-->`, `<script>window.__INITIAL_DATA__ = ${data}</script>`)
    .replace(`<!--app-html-->`, html ?? "");
  await fs.writeFile(outFile, result, "utf-8");
}

async function generateStaticSite() {
  const templatePath = "../../dist/vanilla/index.html";
  const template = await fs.readFile(templatePath, "utf-8");
  mockServer.listen({ onUnhandledRequest: "bypass" });

  try {
    // 홈
    await writeRoute(BASE, template, templatePath);

    // 상품 상세 20개
    const productIds = items.slice(100, 130).map((p) => p.productId);
    const testItem = items.find((product) => product.productId === "86940857379");

    productIds.push(testItem.productId);

    for (const id of productIds) {
      const url = `${BASE}product/${id}/`;
      const outDir = `../../dist/vanilla/product/${id}`;
      await fs.mkdir(outDir, { recursive: true });
      await writeRoute(url, template, `${outDir}/index.html`);
    }
    console.log("✅ SSG 완료: 홈 + 상품 상세 86940857379, 85067212996 포함 31개 생성");
  } finally {
    mockServer.close();
  }
}

await generateStaticSite();
