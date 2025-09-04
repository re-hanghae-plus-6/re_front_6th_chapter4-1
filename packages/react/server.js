import express from "express";
import fs from "node:fs/promises";
import sirv from "sirv";
import compression from "compression";
import { createServer } from "vite";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174;
const templateHtml = prod ? await fs.readFile("./dist/react/index.html", "utf-8") : "";
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/react/" : "/");
const app = express();
let vite = await import("vite");
let mockServer;

if (!prod) {
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });
  const { mockServer: msw } = await vite.ssrLoadModule("./src/mocks/serverMock.ts");

  mockServer = msw;
  mockServer.listen({
    onUnhandledRequest: "bypass", // 처리되지 않은 요청은 통과
  });

  app.use(vite.middlewares);
} else {
  const { setupServer } = await import("msw/node");
  const { handlers } = await import("./src/mocks/handlers.ts");
  mockServer = setupServer(...handlers);
  mockServer.listen({
    onUnhandledRequest: "bypass",
  });

  app.use(compression());
  app.use(base, sirv("./dist/react", { extensions: [] }));
}

app.get(/^(?!.*\/api).*/, async (req, res) => {
  try {
    let template;
    let render;

    if (!prod) {
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(req.originalUrl, template);
      render = (await vite.ssrLoadModule("/src/main-server.tsx")).render;
    } else {
      template = templateHtml;
      render = (await import("./dist/react-ssr/main-server.js")).render;
    }

    const rendered = await render(req.originalUrl, req.query);

    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? "")
      .replace(`<!--app-data-->`, `<script>window.__INITIAL_DATA__ = ${rendered.data}</script>`)
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
  console.log(`React Server started at http://localhost:${port}${base}`);
});
