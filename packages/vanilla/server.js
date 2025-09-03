import express from "express";
import fs from "fs";
import { server } from "./src/mocks/node.js";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

server.listen({
  onUnhandledRequest: "bypass",
});

const templateHtml = prod ? fs.readFileSync("./dist/vanilla/index.html", "utf-8") : "";
const app = express();

let vite;

if (!prod) {
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });
  app.use(vite.middlewares);
} else {
  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;
  app.use(compression());
  app.use(
    base,
    sirv("dist/vanilla", {
      extensions: [],
    }),
  );
}

app.use("*all", async (req, res) => {
  try {
    if (
      req.originalUrl.includes("favicon") ||
      req.originalUrl.endsWith(".ico") ||
      req.originalUrl.endsWith(".png") ||
      req.originalUrl.endsWith(".jpg") ||
      req.originalUrl.endsWith(".css") ||
      req.originalUrl.endsWith(".js")
    ) {
      return res.status(404).end();
    }

    const url = req.originalUrl.replace(base, "");

    let template;
    let render;

    if (!prod) {
      template = fs.readFileSync("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.js")).render;
    } else {
      template = templateHtml;
      render = (await import("./dist/vanilla-ssr/main-server.js")).render;
    }

    const rendered = await render(url, req.query);

    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? "")
      .replace(`<!--app-html-->`, rendered.html ?? "")
      .replace(
        `<!--app-initial-data-->`,
        `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialData)}</script>`,
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
