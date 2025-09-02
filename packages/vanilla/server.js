import express from "express";
import { getConfig } from "./server/config.js";
import { asyncHandler, errorHandler, notFoundHandler } from "./server/errorHandler.js";
import { setupMiddleware } from "./server/middleware.js";
import { render } from "./server/render.js";
import { createHTMLTemplate } from "./server/template.js";

// 설정 가져오기
const config = getConfig();
const { port, base } = config;

const app = express();

// 미들웨어 설정
const vite = await setupMiddleware(app, config);

// 라우트 설정
app.get(
  "*all",
  asyncHandler(async (req, res) => {
    // SSR 렌더링
    const appHtml = await render(req.url, req.query, vite);

    // HTML 템플릿 생성
    const html = createHTMLTemplate(appHtml);

    res.send(html);
  }),
);

// 404 에러 처리
app.use(notFoundHandler);

// 에러 처리 미들웨어
app.use(errorHandler);

// 서버 시작
app.listen(port, () => {
  console.log(`🚀 Vanilla SSR Server started at http://localhost:${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📍 Base URL: ${base}`);
  console.log(`⏰ Started at: ${new Date().toISOString()}`);
});
