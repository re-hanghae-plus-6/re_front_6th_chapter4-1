import express from "express";
import fs from "fs";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5176;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/react/" : "/");

const app = express();

// ✅ 모든 요청 로깅 미들웨어 (가장 먼저)
app.use((req, res, next) => {
  console.log(`🌍 [${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  console.log(`🔍 User-Agent: ${req.headers["user-agent"]}`);
  next();
});

// ✅ 정적 파일 서빙 추가 (public 폴더만)
app.use(express.static("public"));

let vite;
if (!prod) {
  console.log("🔧 개발 모드: Vite 서버 설정 중...");

  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });

  // ✅ Vite 미들웨어가 모든 개발 파일을 처리하도록
  app.use(vite.middlewares);
} else {
  console.log("🚀 프로덕션 모드: 정적 파일 서빙 설정 중...");

  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;
  app.use(compression());
  app.use(base, sirv("./dist/react", { extensions: [] }));
}

// HTML 템플릿 읽기
const templateHtml = prod ? fs.readFileSync("./dist/react/index.html", "utf-8") : "";

app.get("/favicon.ico", (_, res) => {
  res.status(204).end();
});
app.get("/.well-known/appspecific/com.chrome.devtools.json", (_, res) => {
  res.status(204).end();
});

// ✅ SSR 라우트 핸들러 (모든 HTML 요청 처리)
app.get("*all", async (req, res) => {
  // 정적 파일 요청은 제외
  if (req.path.includes(".") && !req.path.endsWith("/")) {
    return res.status(404).send("Not Found");
  }

  try {
    console.log("🎯 === SSR 요청 디버그 ===");
    console.log("🎯 URL:", req.originalUrl);
    console.log("🎯 Path:", req.path);
    console.log("🎯 Query:", req.query);
    console.log("🎯 Method:", req.method);
    console.log("🎯 //=== SSR 요청 디버그 ===");

    const url = req.originalUrl.replace(base, "");
    const query = req.query;

    let template, render;

    try {
      if (!prod) {
        // 개발 환경
        console.log("📖 개발 모드: index.html 읽기...");
        template = fs.readFileSync("./index.html", "utf-8");
        template = await vite.transformIndexHtml(url, template);

        console.log("📦 개발 모드: main-server.tsx 로드...");
        try {
          render = (await vite.ssrLoadModule("./src/main-server.tsx")).render;
        } catch (ssrError) {
          console.error("❌ SSR 모듈 로드 실패:", ssrError);
          // SSR 실패 시 클라이언트 사이드 렌더링으로 폴백
          render = () => ({
            html: '<div id="root"><!-- SSR 실패, 클라이언트에서 렌더링됩니다 --></div>',
            head: "<title>쇼핑몰</title>",
            initialData: {},
          });
        }
      } else {
        // 프로덕션 환경
        console.log("📖 프로덕션 모드: 템플릿 사용...");
        template = templateHtml;
        try {
          render = (await import("./dist/react-ssr/main-server.js")).render;
        } catch (ssrError) {
          console.error("❌ 프로덕션 SSR 모듈 로드 실패:", ssrError);
          render = () => ({
            html: '<div id="root"><!-- SSR 실패, 클라이언트에서 렌더링됩니다 --></div>',
            head: "<title>쇼핑몰</title>",
            initialData: {},
          });
        }
      }

      console.log("✅ 템플릿 및 render 함수 로드 성공");

      // render 함수 호출
      console.log("🔄 SSR 렌더링 시작...");
      console.log(url);

      const { html, head, initialData } = await render(url, query);

      console.log("✅ SSR 렌더링 완료");
      console.log("📄 HTML 길이:", html?.length || 0);
      console.log("🏷️ Head:", head?.substring(0, 100) + "...");
      console.log("💾 Initial Data keys:", Object.keys(initialData || {}));

      console.log(initialData);

      // 초기 데이터 스크립트 생성
      const initialDataScript =
        Object.keys(initialData || {}).length > 0
          ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData).replace(/</g, "\\u003c")};</script>`
          : "";

      console.log("server html");

      console.log(html);

      // 템플릿 교체
      const finalHtml = template
        .replace("<!--app-html-->", html)
        .replace("<!--app-head-->", head)
        .replace("</head>", `${initialDataScript}</head>`);

      console.log(finalHtml);

      console.log("🎉 최종 HTML 생성 완료, 길이:", finalHtml.length);

      res.setHeader("Content-Type", "text/html");
      res.status(200).send(finalHtml);
    } catch (renderError) {
      console.error("❌ 렌더링 에러:", renderError);
      console.error("❌ Stack:", renderError.stack);

      // 에러 발생 시 클라이언트 사이드 렌더링으로 폴백
      const fallbackHtml = template
        .replace("<!--app-html-->", '<div id="root"><!-- 서버 렌더링 실패, 클라이언트에서 로드됩니다 --></div>')
        .replace("<!--app-head-->", "<title>쇼핑몰</title>")
        .replace("</head>", `<script>window.__SSR_ERROR__ = true;</script></head>`);

      res.status(200).send(fallbackHtml);
    }
  } catch (error) {
    console.error("❌ 전체 에러:", error);
    console.error("❌ Stack:", error.stack);

    res.status(500).send(`
      <html>
        <head><title>서버 오류</title></head>
        <body>
          <h1>서버 내부 오류</h1>
          <details>
            <summary>에러 상세</summary>
            <pre>${error.stack}</pre>
          </details>
        </body>
      </html>
    `);
  }
});

// 에러 핸들링
app.use((error, req, res, next) => {
  console.error("🚨 Express 에러 핸들러:", error);
  res.status(500).send("서버 내부 오류가 발생했습니다.");
});

app.use("/", express.static("dist/react"));

// 서버 시작
app.listen(port, () => {
  console.log(`🚀 React SSR Server started at http://localhost:${port}`);
  console.log(`📁 Base URL: ${base}`);
  console.log(`🔧 Environment: ${prod ? "production" : "development"}`);
  console.log(`🌐 브라우저에서 http://localhost:${port} 로 접속해보세요!`);
});
