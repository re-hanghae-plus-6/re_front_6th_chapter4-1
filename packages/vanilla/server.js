import fs from "node:fs/promises";
import express from "express";
import { getBaseUrl } from "./src/mocks/utils.js";
import { server as mswServer } from "./src/mocks/node.js";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
mswServer.listen({ onUnhandledRequest: "warn" });

// gh-pages 배포 기준
const base = getBaseUrl(prod);

const templateHtml = prod ? await fs.readFile("./dist/vanilla/index.html", "utf-8") : "";

const app = express();

let vite;
if (!prod) {
  // 개발 모드일 때, hmr을 제공하기 위함
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });
  app.use(vite.middlewares);
} else {
  const compression = (await import("compression")).default;
  app.use(compression());
  // 👇 express 내장 static 사용
  app.use(base, express.static("./dist/vanilla-ssr", { extensions: [] }));
}

// Serve HTML
app.get("*all", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");

    /** @type {string} */
    let template;
    let render;
    if (!prod) {
      // 실시간 index.html 반영
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
      .replace(`<!--app-html-->`, rendered.html ?? "");

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
