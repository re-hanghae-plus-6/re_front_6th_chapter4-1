import compression from "compression";
import express from "express";
import fs from "fs";
import { dirname, join } from "path";
import sirv from "sirv";
import { fileURLToPath } from "url";
import { createServer } from "vite";
import { setupServerJsdom } from "../vanilla/src/utils/setupJsDom.js";

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

await setupServerJsdom();

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/react/" : "/");

const app = express();

const vite = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  base,
});

if (prod) {
  // 프로덕션: 빌드된 정적 파일 서빙
  // compression + sirv 사용
  app.use(compression());
  app.use(base, sirv("./dist/react", { extensions: [] }));
} else {
  // Vite dev server + middleware 사용

  app.use(vite.middlewares);
}
const { mswServer } = await vite.ssrLoadModule("./src/mocks/node.ts");

mswServer.listen({
  onUnhandledRequest: "bypass",
});

const render = async (url) => {
  try {
    if (prod) {
      // 프로덕션: 빌드된 SSR 모듈 사용
      const { render } = await import("./dist/react-ssr/main-server.js");
      return await render(url);
    } else {
      // 개발: Vite SSR 모듈 로드
      const { render } = await vite.ssrLoadModule("/src/main-server.tsx");
      return await render(url);
    }
  } catch (error) {
    console.error("Render error:", error);
    return { html: `<div>Error: ${error.message}</div>`, head: "", initialData: {} };
  }
};

const getTemplate = async () => {
  if (prod) {
    return fs.readFileSync(join(__dirname, "dist/react/index.html"), "utf-8");
  } else {
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

if (prod) {
  app.use(base, sirv("dist/react", { extensions: [] }));
}

app.get("*all", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "") || "/";

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
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    console.log(e.stack);
    res.status(500).end(e.stack);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
