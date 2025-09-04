import fs from "node:fs/promises";
import express from "express";
import compression from "compression";
import sirv from "sirv";
import { normalize } from "node:path";
import { mswServer } from "./src/mocks/node.js";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

const templateHtml = prod ? await fs.readFile("./dist/vanilla/index.html", "utf-8") : "";

const app = express();

mswServer.listen({ onUnhandledRequest: "bypass" });

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
  app.use(compression());
  app.use(base, sirv("./dist/vanilla", { extensions: [] }));
}

// Serve HTML
app.use("*all", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");
    const pathname = normalize(`/${url.split("?")[0]}`);

    /** @type {string} */
    let template;
    /** @type {import('./src/main-server.js').render} */
    let render;
    if (!prod) {
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.js")).render;
    } else {
      template = templateHtml;
      render = (await import("./dist/vanilla-ssr/main-server.js")).render;
    }

    const rendered = await render(pathname, req.query);

    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? "")
      .replace(`<!--app-html-->`, rendered.html ?? "")
      .replace(
        `<!-- app-data -->`,
        `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.__INITIAL_DATA__)};</script>`,
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
  console.log(`React Server started at http://localhost:${port}`);
});
