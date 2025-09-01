import express from "express";
import * as fs from "node:fs/promises";

const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (isProduction ? "/front_6th_chapter4-1/vanilla/" : "/");

const templateHtml = isProduction ? await fs.readFile("./dist/vanilla/index.html", "utf-8") : "";

async function createServer() {
  const app = express();

  /** @type {import('vite').ViteDevServer | undefined} */
  let vite;

  if (!isProduction) {
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

  // issue: express 5.x 에서는 * 대신 {*splat} 사용
  // 관련 링크: https://expressjs.com/ko/guide/migrating-5.html#path-syntax
  app.use("/{*splat}", async (req, res) => {
    try {
      const url = req.originalUrl.replace(base, "");

      /** @type {string} */
      let template;
      /** @type {import('./src/main-server.js').render} */
      let render;

      if (!isProduction) {
        template = await fs.readFile("./index.html", "utf-8");
        template = await vite.transformIndexHtml(url, template);
        render = (await vite.ssrLoadModule("/src/main-server.js")).render;
      } else {
        template = templateHtml;
        render = (await import("./dist/vanilla-ssr/main-server.js")).render;
      }

      const rendered = await render(url);

      const html = template
        .replace(`<!--app-head-->`, rendered.head ?? "")
        .replace(`<!--app-html-->`, rendered.html ?? "")
        .replace(
          `</head>`,
          `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialData ?? {})}</script></head>`,
        );

      res.status(200).set({ "Content-Type": "text/html" }).send(html);
    } catch (e) {
      vite?.ssrFixStacktrace(e);
      console.error(e.stack);
      res.status(500).end(e.stack);
    }
  });
  return { app, vite };
}

createServer().then(({ app }) => {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
});
