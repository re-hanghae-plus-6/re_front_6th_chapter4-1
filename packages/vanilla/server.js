import express from "express";
import compression from "compression";
import sirv from "sirv";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

// HTML 템플릿 로드 및 분할
const template = readFileSync(join(__dirname, "index.html"), "utf-8");

const app = express();

let vite;
// 환경 분기
if (!prod) {
  // 개발 환경: Vite dev server
  const { createServer: createViteServer } = await import("vite");
  vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  // Vite의 미들웨어 사용
  app.use(vite.middlewares);
} else {
  app.use(compression());
  // 프로덕션 환경: sirv로 정적 파일 서빙
  app.use(base, sirv("dist/vanilla", { extensions: [] }));
}

// 렌더링 파이프라인
app.use("*all", async (req, res) => {
  try {
    const url = req.originalUrl;

    let htmlTemplate = template;
    let render;

    // 개발 환경에서 Vite transform 적용
    if (!prod) {
      htmlTemplate = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.js")).render;
    } else {
      render = (await import("./dist/vanilla-ssr/main-server.js")).render;
    }

    const rendered = await render(url);

    const initialDataScript = rendered.initialData
      ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialData)};</script>`
      : "";

    const html = htmlTemplate
      .replace(`<!--app-head-->`, rendered.head ?? "")
      .replace(`<!--app-html-->`, rendered.html ?? "")
      .replace(`</head>`, `${initialDataScript}</head>`);

    // Template 치환
    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (e) {
    console.error(e.stack);
    res.status(500).end(e.stack);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
