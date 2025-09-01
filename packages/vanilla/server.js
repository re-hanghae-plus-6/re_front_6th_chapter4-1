import express from "express";

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");
console.log("port", port);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

let vite;

// MSW 서버 설정 (serverHandlers.js에서 가져오기)
try {
  console.log("MSW 서버 설정 시작...");
  const { mswServer } = await import("./src/mocks/serverHandlers.js");

  mswServer.listen({
    onUnhandledRequest: "bypass",
    quiet: false, // MSW 로그 활성화
  });

  console.log("🚀 MSW 서버 시작 완료!");
} catch (error) {
  console.error("MSW 서버 설정 실패:", error);
}

// 개발/프로덕션 환경 분기
if (!prod) {
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
  app.use(base, sirv("./dist/vanilla/", { extensions: [] }));
}

// 렌더링 파이프라인
app.use("*all", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");

    // 정적 파일은 SSR에서 제외
    if (
      url.includes("favicon") ||
      url.includes("well-known") ||
      url.includes(".ico") ||
      url.includes(".png") ||
      url.includes(".jpg") ||
      url.includes(".css") ||
      url.includes(".js")
    ) {
      return res.status(404).json({ error: "Not found" });
    }

    let template;
    let render;

    if (!prod) {
      // 개발: index.html을 읽고 Vite로 변환
      template = fs.readFileSync(path.resolve(__dirname, "index.html"), "utf-8");
      template = await vite.transformIndexHtml(url, template);

      // SSR 모듈 로드
      ({ render } = await vite.ssrLoadModule("/src/main-server.js"));
    } else {
      // 프로덕션: 빌드된 파일 사용
      template = fs.readFileSync(path.resolve(__dirname, "./dist/vanilla/index.html"), "utf-8");
      ({ render } = await import(path.resolve(__dirname, "./dist/vanilla-ssr/main-server.js")));
    }

    // 서버 렌더링 실행
    const { html, head, initialData } = await render(url);

    // 초기 데이터 스크립트 생성
    const initialDataScript = `<script>window.__INITIAL_DATA__=${JSON.stringify(initialData)};</script>`;

    // Template 치환
    const finalHtml = template
      .replace("<!--app-head-->", head || "")
      .replace("<!--app-html-->", html)
      .replace("<!--app-initial-data-->", initialDataScript);

    res.status(200).set({ "Content-Type": "text/html" }).end(finalHtml);
  } catch (e) {
    if (!prod && vite) vite.ssrFixStacktrace(e);
    console.error("SSR Error:", e);
    res.status(500).end("Internal Server Error");
  }
});

app.listen(port, () => {
  console.log(`SSR server started at http://localhost:${port}`);
});

// const render = () => {
//   return `<div>안녕하세요</div>`;
// };

// app.get("*all", (req, res) => {
//   res.send(
//     `
// <!DOCTYPE html>
// <html lang="en">
// <head>
//   <meta charset="UTF-8" />
//   <meta name="viewport" content="width=device-width, initial-scale=1.0" />
//   <title>Vanilla Javascript SSR</title>
// </head>
// <body>
// <div id="app">${render()}</div>
// </body>
// </html>
//   `.trim(),
//   );
// });

// // Start http server
// app.listen(port, () => {
//   console.log(`React Server started at http://localhost:${port}`);
// });
