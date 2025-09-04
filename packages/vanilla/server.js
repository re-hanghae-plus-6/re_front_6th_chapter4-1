import compression from "compression";
import express from "express";
import fs from "fs/promises";
import sirv from "sirv";
import { mswServer } from "./src/mocks/mswServer.js";

// 환경 변수 및 설정
const isProd = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const baseUrl = process.env.BASE || (isProd ? "/front_6th_chapter4-1/vanilla/" : "/");
const templateHtml = isProd ? await fs.readFile("dist/vanilla/index.html", "utf-8") : "";
const app = express();

let vite;

// MSW 서버 시작 (API 모킹을 위해)
mswServer.listen({
  onUnhandledRequest: "bypass",
});

// 환경별 정적 파일 서빙 및 미들웨어 설정
if (isProd) {
  // 프로덕션 환경: 빌드된 정적 파일 서빙 (assets만 서빙하도록 제한)
  app.use(compression());
  app.use(`${baseUrl}assets`, sirv("dist/vanilla/assets", { dev: false }));
  app.use(`${baseUrl}mockServiceWorker.js`, sirv("dist/vanilla", { dev: false }));
} else {
  // 개발 환경: Vite 개발 서버를 미들웨어로 사용
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    baseUrl,
  });

  app.use(vite.middlewares);
}

// 모든 라우트를 처리하는 SSR 핸들러
app.get(/^(?!.*\/api).*/, async (req, res) => {
  try {
    let template;
    let render;

    if (!isProd) {
      // 개발 환경: 매 요청마다 템플릿을 다시 읽고 변환
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(req.originalUrl, template);
      render = (await vite.ssrLoadModule("./src/main-server.js")).render;
    } else {
      // 프로덕션 환경: 미리 로드된 템플릿과 빌드된 모듈 사용
      template = templateHtml;
      render = (await import("./dist/vanilla-ssr/main-server.js")).render;
    }

    // SSR 렌더링 실행
    const rendered = await render(req.originalUrl, req.query);

    // HTML 템플릿에 렌더링된 내용 삽입
    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? "")
      .replace(`<!--app-data-->`, `<script>window.__INITIAL_DATA__ = ${rendered.data}</script>`)
      .replace(`<!--app-html-->`, rendered.html ?? "");

    // 클라이언트에 완성된 HTML 응답
    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// HTTP 서버 시작
app.listen(port, () => {
  console.log(`🚀 Server started at http://localhost:${port}`);
  console.log(`📁 Environment: ${isProd ? "production" : "development"}`);
  console.log(`📍 Base URL: ${baseUrl}`);
});
