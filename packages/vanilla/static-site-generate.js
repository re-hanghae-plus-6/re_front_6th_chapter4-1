import fs from "fs";
import { server } from "./src/mocks/serverBrowser.js";
import { createServer } from "vite";
import path from "path";
server.listen({ onUnhandledRequest: "bypass" });

const vite = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});
async function generateStaticSite(pathname, query = {}) {
  const template = fs.readFileSync("./index.html", "utf-8");
  const outputPath = pathname === "/" ? "../../dist/vanilla/index.html" : `../../dist/vanilla${pathname}index.html`;

  const outputDir = path.dirname(outputPath);

  // Vite를 통해 SSR 모듈 로드 (개발 환경과 동일한 방식)
  const { render } = await vite.ssrLoadModule("/src/main-server.js");

  // HTML 템플릿 읽기

  // 홈페이지 렌더링 (빈 쿼리로)
  const rendered = await render(pathname || "/", query);

  // rendered가 문자열이면 html만, 객체면 html과 head 추출
  const htmlContent = typeof rendered === "string" ? rendered : rendered?.html || "";
  const headContent = typeof rendered === "object" ? rendered?.head || "" : "";
  console.log("렌더링 결과 타입:", typeof rendered);
  console.log("렌더링 결과 head:", rendered?.head?.substring(0, 100));
  // 결과 HTML 생성하기
  const result = template
    .replace(`<!--app-head-->`, headContent)
    .replace(`<!--app-html-->`, htmlContent)
    .replace(`<!--app-data-->`, `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered)};</script>`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(outputPath, result);
}
// 서버들 종료 (에러 발생 여부와 관계없이 실행)

await generateStaticSite("/");

// 실행
const { getProducts } = await vite.ssrLoadModule("./src/api/productApi.js");
const { products } = await getProducts();
await Promise.all(products.map(async ({ productId }) => await generateStaticSite(`/product/${productId}/`)));
vite.close();

server.close();
