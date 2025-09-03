import fs from "node:fs/promises";
import { normalize } from "node:path";
import compression from "compression";
import sirv from "sirv";
import { server as mswServer } from "./src/mocks/nodeServer";
import { safeSerialize } from "./src/utils/serialized";
import express from "express";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/react/" : "/");

mswServer.listen({
  onUnhandledRequest: "bypass",
});

const templateHtml = prod ? await fs.readFile("./dist/react/index.html", "utf-8") : "";

const app = express();

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
  app.use(base, sirv("./dist/react", { extensions: [] }));
}

// Serve HTML
app.use("*all", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");
    const pathname = normalize(`/${url.split("?")[0]}`);

    /** @type {string} */
    let template;
    /** @type {import('./src/main-server.tsx').render} */
    let render;
    if (!prod) {
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.tsx")).render;
    } else {
      template = templateHtml;
      render = (await import("./dist/react-ssr/main-server.tsx")).render;
    }

    const rendered = await render(pathname, req.query);

    const serialized = safeSerialize(rendered.__INITIAL_DATA__);
    const initialDataScript = `<script>window.__INITIAL_DATA__ = ${serialized};</script>`;
    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? "")
      .replace(`<!--app-html-->`, rendered.html ?? "")
      .replace(`<!-- app-data -->`, initialDataScript);

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
