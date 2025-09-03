import fs from "node:fs/promises";
import express from "express";
import { ApiRouter } from "./src/lib/ApiRouter.js";
import { registerApiRoutes } from "./src/api/routes.js";
import { mswServer } from "./src/mocks/node.js";

// Constants
const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || "/";

// Cached production assets
const templateHtml = isProduction ? await fs.readFile("./dist/client/index.html", "utf-8") : "";

// MSW 서버 시작 (개발 환경에서만)
if (!isProduction) {
  mswServer.listen({
    onUnhandledRequest: "bypass",
  });
  console.log("MSW 서버 시작 완료");
}

// Create http server
const app = express();

// JSON 요청 본문을 파싱하는 미들웨어 추가
app.use(express.json());

// API 라우터 초기화
const apiRouter = new ApiRouter("/api");
registerApiRoutes(apiRouter);

// Add Vite or respective production middlewares
/** @type {import('vite').ViteDevServer | undefined} */
let vite;
if (!isProduction) {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });
  app.use(vite.middlewares);
} else {
  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;
  app.use(compression());
  app.use(base, sirv("./dist/client", { extensions: [] }));
}

// API 라우트 - 새로운 API 라우터 사용
app.use("/api", apiRouter.middleware.bind(apiRouter));

// Serve HTML - 모든 라우트에 대해
app.use(async (req, res) => {
  console.log(" serve html ");
  try {
    const url = req.originalUrl.replace(base, "");

    /** @type {string} */
    let template;
    /** @type {import('./src/main-server.js').render} */
    let render;
    if (!isProduction) {
      // Always read fresh template in development
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.js")).render;
    } else {
      template = templateHtml;
      // 빌드된 main-server.js 파일을 동적으로 찾기
      const fs = await import("node:fs/promises");
      const path = await import("node:path");
      const serverAssetsDir = "./dist/server/client/assets";
      const files = await fs.readdir(serverAssetsDir);
      const mainServerFile = files.find((file) => file.startsWith("main-server-") && file.endsWith(".js"));
      if (!mainServerFile) {
        throw new Error("main-server.js 파일을 찾을 수 없습니다");
      }
      render = (await import(path.resolve(serverAssetsDir, mainServerFile))).render;
    }

    const query = Object.fromEntries(new URLSearchParams(req.url.split("?")[1] || ""));
    const rendered = await render(url, query);
    console.log(rendered);

    // 초기 데이터 스크립트 생성
    const initialDataScript = `
      <script>
        window.__INITIAL_DATA__ = ${JSON.stringify(rendered.__INITIAL_DATA__ || {})};
      </script>
    `;

    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? "")
      .replace(`<!--app-html-->`, rendered.html ?? "")
      .replace("</head>", `${initialDataScript}</head>`);

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    console.log(e.stack);
    res.status(500).end(e.stack);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`쇼핑몰 SSR 서버가 http://localhost:${port}에서 시작되었습니다`);
});
