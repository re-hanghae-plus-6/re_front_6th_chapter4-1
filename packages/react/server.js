import express from "express";
import * as fs from "fs";
import { createServer } from "vite";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/react/" : "");

const app = express();

const templateHtml = prod ? fs.readFileSync("./dist/react/index.html", "utf-8") : "";

/** @type {import('vite').ViteDevServer} */
const vite = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
  base,
});

if (!prod) {
  app.use(vite.middlewares);
} else {
  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;

  app.use(compression());
  app.use(base, sirv("./dist/react", { extensions: [] }));
}

app.use("*all", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");
    let template, ssrService;

    if (!prod) {
      const { SSRService } = await vite.ssrLoadModule("./src/main-server.tsx");

      template = await vite.transformIndexHtml(url, fs.readFileSync("./index.html", "utf-8"));
      ssrService = new SSRService();
    } else {
      const { SSRService } = await import("./dist/react-ssr/main-server.js");

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

const { mswServer } = await vite.ssrLoadModule("./src/mocks/node.ts");
mswServer.listen({
  onUnhandledRequest: "bypass",
});

app.listen(port, () => {
  console.log(`react Server started at http://localhost:${port}`);
});
