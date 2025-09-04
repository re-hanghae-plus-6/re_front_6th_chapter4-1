import fs from "node:fs/promises";
import express from "express";

// Constants
const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5176;
const base = process.env.BASE || (isProduction ? "/front_6th_chapter4-1/react/" : "/");

// Cached production assets
const templateHtml = isProduction ? await fs.readFile("./dist/react/index.html", "utf-8") : "";

// MSW 서버 시작 (항상)
const { mswServer } = await import("./src/mocks/node.js");
mswServer.listen({
  onUnhandledRequest: "bypass",
});
console.log("MSW 서버 시작 완료");

// Create http server
const app = express();

// JSON 요청 본문을 파싱하는 미들웨어 추가
app.use(express.json());

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
  app.use(base, sirv("./dist/react", { extensions: [] }));
}

// API 라우트 - Express Router 사용
const { createApiRouter } = await import("./src/api/routes.js");
app.use("/api", createApiRouter());

// Serve HTML
app.use("*", async (req, res) => {
  // API 경로는 SSR에서 제외
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "API endpoint not found" });
  }

  try {
    const url = req.originalUrl.replace(base, "");

    /** @type {string} */
    let template;
    /** @type {import('./src/main-server.tsx').render} */
    let render;
    if (!isProduction) {
      // Always read fresh template in development
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.tsx")).render;
    } else {
      template = templateHtml;
      render = (await import("./dist/react-ssr/main-server.js")).render;
    }

    const rendered = await render(url, req.query);

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
  console.log(`React SSR 서버가 http://localhost:${port}에서 시작되었습니다`);
});
