import fs from "node:fs/promises";
import express from "express";

import { mockServer } from "./src/mocks/server-mock.js";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

const templateHtml = prod ? fs.readFile("dist/vanilla/index.html", "utf-8") : "";

const app = express();

let vite;

mockServer.listen({
  onUnhandledRequest: "bypass", // 처리되지 않은 요청은 통과
});

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

app.get("*all", async (req, res) => {
  try {
    let template;
    let render;
    if (!prod) {
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(req.originalUrl, template);
      render = (await vite.ssrLoadModule("/src/main-server.js")).render;
    } else {
      template = templateHtml;
      render = (await import("./dist/vanilla-ssr/main-server.js")).render;
    }
    const rendered = await render(req.originalUrl, req.query);
    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? "")
      .replace(`<!--app-html-->`, rendered.html ?? "");

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (error) {
    vite?.ssrFixStacktrace(error);
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
