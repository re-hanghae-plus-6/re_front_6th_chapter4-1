import express from "express";
import fs from "node:fs/promises";
import path from "node:path";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/react/" : "/");

const templateHtml = prod ? await fs.readFile("./dist/react/index.html", "utf-8") : "";

const app = express();

// 불필요한 요청 무시
app.get("/favicon.ico", (_, res) => {
  res.status(204).end();
});
app.get("/.well-known/appspecific/com.chrome.devtools.json", (_, res) => {
  res.status(204).end();
});

// Add Vite or respective production middlewares
/** @type {import('vite').ViteDevServer | undefined} */
let vite;
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
  app.use(base, sirv("./dist/react", { extensions: [] }));
}

// Serve HTML
app.use("*all", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");
    const pathname = path.normalize(`/${url.split("?")[0]}`);

    let template;
    let render;
    if (!prod) {
      // 개발 환경: Vite로 main-server.tsx 로드
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.tsx")).render;
    } else {
      // 프로덕션 환경: 빌드된 main-server.js 로드
      template = templateHtml;
      render = (await import("./dist/react-ssr/main-server.js")).render;
    }

    const rendered = await render(pathname, req.query);

    // HTML 템플릿 치환 (React 방식)
    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? "")
      .replace(`<!--app-html-->`, rendered.html ?? "")
      .replace(`</head>`, `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialData)};</script></head>`);

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    console.log(e.stack);
    res.status(500).end(e.stack);
  }
});

app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
