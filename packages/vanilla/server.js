import express from "express";
import fs from "fs/promises";

const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (isProduction ? "/front_6th_chapter4-1/vanilla/" : "/");

const templateHtml = isProduction ? await fs.readFile("./dist/vanilla/index.html", "utf-8") : "";

const app = express();

let vite;
if (!isProduction) {
  // 개발환경이 아닐때 vite 서버를 미들웨어로 등록
  // 번들링된 파일 제공
  // HMR 제공
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });

  app.use(vite.middlewares);
} else {
  // 프로덕션 환경에서 정적 파일을 서빙

  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;
  // - HTTP 응답을 gzip/deflate로 압축하여 전송
  // - 네트워크 대역폭을 절약하고 로딩 속도 향상
  // - 프로덕션 환경에서 성능 최적화를 위해 사용
  app.use(compression());
  // - `sirv`: 정적 파일 서빙을 위한 고성능 미들웨어
  // - `"./dist/vanilla"`: 빌드된 정적 파일들이 위치한 디렉토리
  app.use(base, sirv("./dist/vanilla", { extensions: [] }));
}

app.get("*all", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "/");

    let template;
    let render;

    if (!isProduction) {
      // Always read fresh template in development
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.js")).render;
    } else {
      template = templateHtml;
      render = (await import("./dist/vanilla-ssr/main-server.js")).render;
    }

    const rendered = await render(url);

    const initialDataScript = rendered.initialData
      ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialData)};</script>`
      : "";

    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? "")
      .replace(`<!--app-html-->`, rendered.html ?? "")
      .replace(`<!--app-data-->`, initialDataScript);

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
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
