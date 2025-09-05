import fs from "fs";
import { createServer } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";

// Vite 미들웨어 생성
const vite = await createServer({
  plugins: [
    react({
      jsxRuntime: "automatic",
    }),
  ],
  server: { middlewareMode: true },
  appType: "custom",
});

// MSW 서버 핸들러 로드
const { mswServer } = await vite.ssrLoadModule("./src/mocks/serverHandlers.js");

// MSW 서버 실행
mswServer.listen({
  onUnhandledRequest: "bypass",
});

// vite 미들웨어를 통해 main-server.tsx 모듈 로드
const { render } = await vite.ssrLoadModule("./src/main-server.js");

/**
 * @description
 * 주어진 경로 조각들을 기반으로 최종 SSG 결과물이 저장되는
 * `../../dist/react` 디렉토리 하위의 절대 경로를 생성
 * OS마다 다른 경로 구분자(`/` vs `\`)를 자동으로 처리하기 위함
 * @param {...string} pathnames - 결합할 경로 조각들
 * @returns {string} dist/react 하위의 안전한 파일 경로
 */
const joinDist = (...pathnames) => path.join("../../dist/react", ...pathnames);

// HTML 템플릿 읽기
const template = fs.readFileSync(joinDist("/index.html"), "utf-8");

async function generateStaticSite(pathname) {
  const fullPathname = pathname.endsWith(".html") ? joinDist(pathname) : joinDist(pathname, "/index.html");

  const parsedPath = path.parse(fullPathname);

  // render 실행 → { head, html, initialData }
  const rendered = await render(pathname);

  // HTML 완성
  const html = template
    .replace(`<!--app-head-->`, rendered.head ?? "")
    .replace(`<!--app-html-->`, rendered.html ?? "")
    .replace(
      `<!--app-initial-data-->`,
      `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialData)}</script>`,
    );

  // 디렉토리 없으면 생성
  if (!fs.existsSync(parsedPath.dir)) {
    fs.mkdirSync(parsedPath.dir, { recursive: true });
  }

  // HTML 저장
  fs.writeFileSync(fullPathname, html);

  // 홈이나 상세페이지일 경우 JSON도 저장
  if (pathname === "/") {
    fs.writeFileSync(joinDist("index.json"), JSON.stringify(rendered.initialData));
  }
  if (pathname.startsWith("/product/")) {
    const productId = pathname.split("/")[2];
    fs.writeFileSync(joinDist(`product/${productId}.json`), JSON.stringify(rendered.initialData));
  }
}

// 404 페이지 생성
await generateStaticSite("/404.html");

// 홈 생성 (HTML + JSON)
await generateStaticSite("/");

// 상세 페이지 생성 (HTML + JSON)
const { getProducts } = await vite.ssrLoadModule("./src/api/productApi.js");
const { products } = await getProducts();

await Promise.all(products.map(({ productId }) => generateStaticSite(`/product/${productId}/`)));

mswServer.close();
vite.close();
