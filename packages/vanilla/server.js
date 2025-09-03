import fs from "node:fs/promises";
import express from "express";
import { ApiRouter } from "./src/lib/ApiRouter.js";
import { registerApiRoutes } from "./src/api/routes.js";
import { mswServer } from "./src/mocks/node.js";

async function startServer() {
  // Constants
  const isProduction = process.env.NODE_ENV === "production";
  const port = process.env.PORT || 5173;
  const base = process.env.BASE || (isProduction ? "/front_6th_chapter4-1/vanilla/" : "/");

  // Cached production assets
  let templateHtml = "";
  if (isProduction) {
    templateHtml = await fs.readFile("./dist/client/index.html", "utf-8");
  }

  // MSW 서버 시작 (항상)
  mswServer.listen({
    onUnhandledRequest: "bypass",
  });
  console.log("MSW 서버 시작 완료");

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

  // Serve HTML - API 경로가 아닌 경우에만
  app.use(async (req, res) => {
    // API 경로는 SSR에서 제외
    if (req.path.startsWith("/api/")) {
      return res.status(404).json({ error: "API endpoint not found" });
    }

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
        // 빌드된 main-server.js 파일 로드
        const path = await import("node:path");
        const serverFilePath = "./dist/server/main-server.js";
        render = (await import(path.resolve(serverFilePath))).render;
      }

      const rendered = await render(url, req.query);
      console.log(rendered);

      const html = template
        .replace(`<!--app-head-->`, rendered.head ?? "")
        .replace(`<!--app-html-->`, rendered.html ?? "")
        .replace(
          `<!-- app-data -->`,
          `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.__INITIAL_DATA__ || {})};</script>`,
        );

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
}

// 서버 시작
startServer().catch(console.error);
