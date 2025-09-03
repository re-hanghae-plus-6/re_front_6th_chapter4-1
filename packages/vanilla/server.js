import compression from "compression";
import express from "express";
import fs from "fs";
import { dirname, join } from "path";
import sirv from "sirv";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { setupServerJsdom } from "./src/utils/setupJsDom.js";

import { mswServer } from "./src/mocks/node.js";

mswServer.listen({
  onUnhandledRequest: "bypass",
});

// JSDOM 환경 설정
await setupServerJsdom();

export const prod = process.env.NODE_ENV === "production";
export const port = process.env.PORT || 5174;
export const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let vite;

if (prod) {
  // 프로덕션: 빌드된 정적 파일 서빙
  // compression + sirv 사용
  app.use(compression());
  app.use(base, sirv("./dist/vanilla", { extensions: [] }));
} else {
  // Vite dev server + middleware 사용
  vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });

  app.use(vite.middlewares);
}

const render = async (url) => {
  try {
    if (prod) {
      // 프로덕션: 빌드된 SSR 모듈 사용
      const { render } = await import("./dist/vanilla-ssr/main-server.js");
      return await render(url);
    } else {
      // 개발: Vite SSR 모듈 로드
      const { render } = await vite.ssrLoadModule("/src/main-server.js");
      return await render(url);
    }
  } catch (error) {
    console.error("Render error:", error);
    return { html: "<div>Error</div>", head: "", initialData: {} };
  }
};

const getTemplate = async () => {
  if (prod) {
    // ! 프로덕션: 빌드된 HTML 사용
    return fs.readFileSync(join(__dirname, "dist/vanilla/index.html"), "utf-8");
  } else {
    // ! 개발: 개발용 HTML 사용 + Vite 변환
    // return fs.readFileSync("./dist/vanilla/index.html", "utf-8");
    let template = fs.readFileSync("./index.html", "utf-8");
    return await vite.transformIndexHtml("/*", template);
  }
};

// DevTools 및 .well-known 요청 처리
app.use((req, res, next) => {
  const url = req.originalUrl.replace(base, "");

  // .well-known 경로나 DevTools 관련 요청은 404 응답
  if (
    url.startsWith(".well-known") ||
    url.includes("devtools") ||
    url.includes("chrome-devtools") ||
    url.includes("favicon.ico")
  ) {
    return res.status(404).end();
  }

  next();
});

// 정적 파일 서빙
// 개발 환경에서는 Vite가 정적 파일을 처리하므로 별도 설정 불필요
if (prod) {
  app.use(base, sirv("dist/vanilla", { dev: false }));
}

// 초기 페이지 로드 시 서버에서 HTML 생성 - SSR
app.use("*all", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");
    const pathname = url.split("?")[0];

    const { html, head, initialData } = await render(pathname, req.query);

    const template = await getTemplate();

    const initialDataScript = initialData
      ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};</script>`
      : "";

    const finalHtml = template
      .replace("<!--app-html-->", html)
      .replace("<!--app-head-->", head)
      .replace("</head>", `${initialDataScript}</head>`);

    res.status(200).set({ "Content-Type": "text/html" }).end(finalHtml);
  } catch (error) {
    vite?.ssrFixStacktrace(error);
    res.status(500).end(error.stack);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
