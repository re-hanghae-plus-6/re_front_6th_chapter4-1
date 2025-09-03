import fs from "node:fs/promises";
import express from "express";
import { server } from "./src/mocks/serverBrowser.js";
// Constants
const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (isProduction ? "/front_6th_chapter4-1/vanilla/" : "/");

// Cached production assets
const templateHtml = isProduction ? await fs.readFile("./dist/vanilla/index.html", "utf-8") : "";

server.listen();
// Create http server
const app = express();
app.get("/.well-known/appspecific/com.chrome.devtools.json", (_, res) => {
  res.status(204).end();
});
// Add Vite or respective production middlewares
/** @type {import('vite').ViteDevServer | undefined} */
let vite;
if (!isProduction) {
  // 개발 환경: Vite 개발 서버 연동
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });
  app.use(vite.middlewares);
} else {
  // 프로덕션 환경: 정적 파일 서빙 + 압축
  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;
  app.use(compression());
  app.use(base, sirv("./dist/vanilla", { extensions: [] }));
}

// Serve HTML - SSR 라우팅
app.use("*all", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");

    /** @type {string} */
    let template;
    /** @type {import('./src/main-server.js').render} */
    let render;

    if (!isProduction) {
      // 개발: 매번 새로 읽고 변환
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.js")).render;
    } else {
      // 프로덕션: 캐시된 템플릿과 빌드된 모듈 사용
      template = templateHtml;
      render = (await import("./dist/vanilla-ssr/main-server.js")).render;
    }

    // URL에서 쿼리 파라미터 분리
    const [pathname, search] = url.split("?");
    const query = new URLSearchParams(search || "");
    const queryObj = Object.fromEntries(query.entries());

    // SSR 렌더링 수행
    // 인자를 전달도 해야함
    const rendered = await render(pathname || "/", queryObj);

    // rendered가 문자열이면 html만, 객체면 html과 head 추출
    const htmlContent = typeof rendered === "string" ? rendered : rendered?.html || "";
    const headContent = typeof rendered === "object" ? rendered?.head || "" : "";

    // 클라이언트용 순수 데이터 추출 (HTML 코드 제외)
    const clientData = typeof rendered === "object" ? rendered.data || {} : {};

    // HTML 템플릿에 렌더링 결과 주입
    const html = template
      .replace(`<!--app-head-->`, headContent)
      .replace(`<!--app-html-->`, htmlContent)
      .replace(`<!--app-data-->`, `<script>window.__INITIAL_DATA__ = ${JSON.stringify(clientData)};</script>`);

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (e) {
    // 개발 환경에서 스택 트레이스 개선
    if (vite) {
      vite.ssrFixStacktrace(e);
    }
    console.error("SSR Error:", e.stack);
    res.status(500).end(e.stack);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`Server started at http://localhost:${port}`);
});
