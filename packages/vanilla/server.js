import express from "express";
import fs from "fs";
import { dirname, join } from "path";
import sirv from "sirv";
import { fileURLToPath } from "url";

import { setupServerJsdom } from "./src/utils/setupJsDom.js";

// JSDOM 환경 설정
setupServerJsdom();

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let vite;

if (prod) {
  // 프로덕션: 빌드된 정적 파일 서빙
  // compression + sirv 사용
  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;

  app.use(compression());
  app.use(base, sirv("./dist/vanilla", { extensions: [] }));
} else {
  // Vite dev server + middleware 사용
  const { createServer } = await import("vite");

  vite = await createServer({
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
    return fs.readFileSync(join(__dirname, "dist/vanilla/index.html"), "utf-8");
  } else {
    // ! dev에서는 개발에서 사용하는 index.html을 사용
    // return fs.readFileSync("./dist/vanilla/index.html", "utf-8");
    let template = fs.readFileSync("./index.html", "utf-8");
    return await vite.transformIndexHtml("/*", template);
  }
};

// 정적 파일 서빙
if (prod) {
  app.use(base, sirv("dist/vanilla", { dev: false }));
} else {
  // 개발 환경에서는 Vite가 정적 파일을 처리하므로 별도 설정 불필요
}

// 초기 페이지 로드 시 서버에서 HTML 생성 - SSR
app.use("*all", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");

    const { html, head, initialData } = await render(url);

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
    console.log(error.stack);
    res.status(500).end(error.stack);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
