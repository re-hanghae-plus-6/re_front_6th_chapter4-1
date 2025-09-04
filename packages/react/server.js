import compression from "compression";
import express from "express";
import fs from "node:fs/promises";
import path from "node:path";
import sirv from "sirv";
import { createServer } from "vite";

// 환경 변수 설정
const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174;
const base = process.env.BASE || (isProduction ? "/front_6th_chapter4-1/react/" : "/");

// 프로덕션 환경에서 사용할 HTML 템플릿 미리 로드
const templateHtml = isProduction ? await fs.readFile("./dist/react/index.html", "utf-8") : "";

// Vite 개발 서버 생성 (개발 환경에서 HMR과 트랜스파일링 담당)
const vite = await createServer({
  server: { middlewareMode: true }, // Express와 통합하여 미들웨어 모드로 실행
  appType: "custom",
  base,
});

// MSW(Mock Service Worker) 서버 시작 - API 모킹용
const { mswServer } = await vite.ssrLoadModule("./src/mocks/node.ts");
mswServer.listen({ onUnhandledRequest: "bypass" });

const app = express();

// 개발/프로덕션 환경에 따른 미들웨어 설정
if (!isProduction) {
  // 개발 환경: Vite 미들웨어 사용 (HMR, 실시간 변환 등)
  app.use(vite.middlewares);
} else {
  app.use(compression()); // gzip 압축
  app.use(base, sirv("./dist/react", { extensions: [] })); // 빌드된 정적 파일 서빙
}

// SSR 렌더링 미들웨어 - API 경로 제외한 모든 요청 처리
app.use(/^(?!.*\/api).*$/, async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");
    const pathname = path.normalize(`/${url.split("?")[0]}`);

    let template;
    let render;

    if (!isProduction) {
      // 개발 환경: HTML 템플릿을 실시간으로 읽고 변환
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.tsx")).render;
    } else {
      // 프로덕션 환경: 미리 빌드된 템플릿과 렌더 함수 사용
      template = templateHtml;
      render = (await import("./dist/react-ssr/main-server.js")).render;
    }

    // React 컴포넌트를 서버에서 렌더링
    const rendered = await render(pathname, req.query);

    // HTML 템플릿에 렌더링된 내용 주입
    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? "")
      .replace(`<!--app-html-->`, rendered.html ?? "")
      .replace(
        `<!-- app-data -->`,
        `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.__INITIAL_DATA__)};</script>`,
      ); // 클라이언트 하이드레이션용 초기 데이터 스크립트 생성

    // 완성된 HTML 응답
    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (error) {
    // 개발 환경에서 스택 트레이스 정리
    if (!isProduction && vite) {
      vite.ssrFixStacktrace(error);
    }

    console.error("SSR 렌더링 에러:", error.message);
    res.status(500).end(error.message);
  }
});

// HTTP 서버 시작
app.listen(port, () => {
  console.log(`🚀 React SSR 서버 실행: http://localhost:${port}`);
  console.log(`📦 환경: ${isProduction ? "프로덕션" : "개발"} 모드`);
});
