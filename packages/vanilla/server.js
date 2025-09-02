import fs from "node:fs/promises";
import express from "express";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174; // SSR 서버 포트
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

const templateHtml = prod ? await fs.readFile("./dist/vanilla/index.html", "utf-8") : "";

const app = express();

let vite;
// use 는 모든 요청에 대해 실행되고, get 은 특정 요청에 대해 실행
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
  app.use(base, sirv("./dist/vanilla", { extensions: [] }));
}

// API 프록시 - 기존 API 서버로 요청 전달
app.use("/api/*", async (req, res) => {
  try {
    const apiUrl = `http://localhost:5173${req.url}`;
    const response = await fetch(apiUrl);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error("API 프록시 오류:", error);
    res.status(500).json({ error: "API 서버 연결 실패" });
  }
});

app.use("*", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");

    /** @type {string} */
    let template;
    /** @type {import('./src/main-server.js').render} */
    let render;
    if (!prod) {
      // Always read fresh template in development
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.js")).render;
    } else {
      template = templateHtml;
      render = (await import("./dist/vanilla-ssr/main-server.js")).render;
    }

    // server에 있는 값을 전달해주기 위해서 인자로 넘겨줘야함.
    const query = req.query;
    const rendered = await render(url, query);

    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? "")
      .replace(`<!--app-html-->`, rendered.html ?? "")
      .replace(
        `<!--app-data-->`,
        `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialData)};</script>`,
      );

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    console.log(e.stack);
    res.status(500).end(e.stack);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`Vanilla SSR Server started at http://localhost:${port}`);
});
