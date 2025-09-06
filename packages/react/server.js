import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5176;
const isProduction = process.env.NODE_ENV === "production";

let render;

// SSR 모듈 로드 (path-to-regexp 오류 방지를 위해 try-catch로 감싸기)
try {
  if (isProduction) {
    // 프로덕션: 빌드된 파일 사용
    console.log("Loading production SSR module...");
    const renderModule = await import("./dist/react-ssr/main-server.js");
    render = renderModule.render;

    // 정적 파일 서빙
    app.use(express.static(path.resolve(__dirname, "dist/react")));
    console.log("Production SSR module loaded successfully");
  } else {
    // 개발: 빌드된 파일 사용 (Node.js는 .tsx를 직접 실행할 수 없음)
    console.log("Loading development SSR module...");
    const renderModule = await import("./dist/react-ssr/main-server.js");
    render = renderModule.render;
    console.log("Development SSR module loaded successfully");
  }
} catch (error) {
  console.error("Failed to load SSR module:", error);

  // 오류 발생 시 기본 렌더링 함수 사용
  render = async (url) => {
    return {
      html: `<div class="bg-white">
        <div class="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
          <h1 class="text-xl font-bold text-gray-900 mb-4">
            <a href="/" data-link="/">쇼핑몰</a>
          </h1>
          <div class="text-center">
            <h2 class="text-3xl font-extrabold text-gray-900">SSR 로딩 중...</h2>
            <p class="mt-4 text-lg text-gray-500">서버사이드 렌더링을 준비하고 있습니다.</p>
          </div>
        </div>
      </div>`,
      head: "<title>쇼핑몰 - 로딩 중</title>",
      initialData: JSON.stringify({ type: "loading", data: null, url: url }),
    };
  };
  console.log("Using fallback render function");
}

// SSR 미들웨어
app.get("/{*splat}", async (req, res) => {
  console.log("Server: Request received:", req.originalUrl);
  try {
    const url = req.originalUrl;
    const query = req.query;

    console.log("Server: Rendering URL:", url);
    const { html, head, initialData } = await render(url, query);
    console.log("Server: HTML length:", html.length, 'contains "총":', html.includes("총"));
    console.log("Server: initialData type:", typeof initialData, "length:", initialData.length);

    let template;

    if (isProduction) {
      // 프로덕션: 빌드된 HTML 템플릿 사용
      const templatePath = path.resolve(__dirname, "dist/react/index.html");
      template = fs.readFileSync(templatePath, "utf-8");
    } else {
      // 개발: 기본 HTML 템플릿
      template = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>쇼핑몰</title>
  <!--app-head-->
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"><!--app-html--></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
      `.trim();
    }

    const finalHtml = template
      .replace("<!--app-html-->", html)
      .replace("<!--app-head-->", head)
      .replace("</head>", `<script>window.__INITIAL_DATA__ = ${initialData};</script></head>`);

    res.status(200).set({ "Content-Type": "text/html" }).end(finalHtml);
  } catch (error) {
    console.error("SSR Error:", error);

    // 에러 발생 시 기본 HTML 반환
    const errorHtml = `
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>서버 오류 - 쇼핑몰</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root">
    <div class="bg-white">
      <div class="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <h1 class="text-xl font-bold text-gray-900 mb-4">
          <a href="/" data-link="/">쇼핑몰</a>
        </h1>
        <div class="text-center">
          <h2 class="text-3xl font-extrabold text-gray-900">서버 오류가 발생했습니다</h2>
          <p class="mt-4 text-lg text-gray-500">잠시 후 다시 시도해 주세요.</p>
          <div class="mt-6">
            <a href="/" data-link="/" class="text-indigo-600 hover:text-indigo-500">
              홈으로 돌아가기
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
    `.trim();

    res.status(500).set({ "Content-Type": "text/html" }).end(errorHtml);
  }
});

app.listen(port, () => {
  console.log(`SSR Server running at http://localhost:${port}`);
  console.log(`Environment: ${isProduction ? "production" : "development"}`);
});
