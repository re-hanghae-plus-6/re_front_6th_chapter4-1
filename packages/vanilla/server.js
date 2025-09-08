import compression from "compression";
import express from "express";
import fs from "node:fs/promises";
import sirv from "sirv";

const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173; // SSR 포트
const base = process.env.BASE || (isProduction ? "/front_6th_chapter4-1/vanilla/" : "/");

const app = express();

// HTML 템플릿
let template;

let render;
// 개발 서버 인스턴스
let vite;

// 환경별 설정
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
  // 빌드된 파일들을 gzip 압축으로 전송 (성능 최적화)
  app.use(compression());
  app.use(base, sirv("./dist/vanilla", { extensions: [] }));

  // 빌드된 템플릿과 렌더 함수 로드
  template = await fs.readFile("./dist/vanilla/index.html", "utf-8");
  render = (await import("./dist/vanilla-ssr/main-server.js")).render;
}
// SSR 렌더링 미들웨어 - API 경로 제외한 모든 요청 처리
app.use(/^(?!.*\/api).*$/, async (req, res) => {
  try {
    const url = normalizeUrl(req.originalUrl, base);

    // 개발 환경에서만 매 요청마다 최신 모듈 로드 (HMR 지원)
    if (!isProduction) {
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.js")).render;
    }

    // SSR 렌더링
    const rendered = await render(url, req.query);

    // 클라이언트 하이드레이션용 초기 데이터 스크립트 생성
    const initialDataScript = rendered.initialData
      ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialData)}</script>`
      : "";

    // 렌더링 결과를 HTML 템플릿에 주입
    const html = template
      .replace("<!--app-head-->", rendered.head ?? "")
      .replace("<!--app-html-->", rendered.html ?? "")
      .replace("</head>", `${initialDataScript}</head>`);

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (error) {
    // 개발 환경에서 스택 트레이스 정리
    if (!isProduction && vite) {
      vite.ssrFixStacktrace(error);
    }

    console.error("SSR 렌더링 에러:", error.message);
    res.status(500).end(error.stack);
  }
});
// HTTP 서버 시작
app.listen(port, () => {
  console.log(`🌐 SSR 서버가 http://localhost:${port} 에서 실행 중입니다`);
});

// URL 정규화 함수
function normalizeUrl(originalUrl, basePath) {
  const withoutBase = originalUrl.replace(basePath, "") || "/";
  const withSlash = withoutBase.startsWith("/") ? withoutBase : "/" + withoutBase;
  return withSlash.replace(/\/+/g, "/");
}
