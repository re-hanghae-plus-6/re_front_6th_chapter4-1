import express from "express";
import * as fs from "fs";

import { mswServer } from "./src/mocks/node.js";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "");

const app = express();

const templateHtml = prod ? fs.readFileSync("./dist/vanilla/index.html", "utf-8") : "";

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
  app.use(base, sirv("./dist/vanilla", { extensions: [] }));
}

app.use("*all", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");
    let template, ssrService;

    if (!prod) {
      const { SSRService } = await vite.ssrLoadModule("/src/main-server.js");

      template = await vite.transformIndexHtml(url, fs.readFileSync("./index.html", "utf-8"));
      ssrService = new SSRService();
    } else {
      const { SSRService } = await import("./dist/vanilla-ssr/main-server.js");

      template = templateHtml;
      ssrService = new SSRService();
    }

    const rendered = await ssrService.render(url, req.query);
    const html = template
      .replace("<!--app-head-->", rendered.head ?? "")
      .replace("<!--app-html-->", rendered.html ?? "")
      .replace("<!--app-data-->", `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.data)};</script>`);

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    console.log(e.stack);
    res.status(500).end(e.stack);
  }
});

mswServer.listen({
  onUnhandledRequest: "bypass",
});

// Start http server
app.listen(port, () => {
  console.log(`Vanilla Server started at http://localhost:${port}`);
});
