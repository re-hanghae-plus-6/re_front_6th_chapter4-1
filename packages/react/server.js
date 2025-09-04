import express from "express";
import fs from "node:fs/promises";
import { createServer } from "vite";
const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/react/" : "/");

const templateHtml = prod ? await fs.readFile("./dist/react/index.html", "utf-8") : "";
// Add Vite or respective production middlewares
/** @type {import('vite').ViteDevServer | undefined} */
let vite;

if (!prod) {
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });

  const { server } = await vite.ssrLoadModule("./src/mocks/mswServer");
  await server.listen({
    onUnhandledRequest: "bypass",
  });
}

const app = express();

// 무시
app.get("/.well-known/appspecific/com.chrome.devtools.json", (_, res) => {
  res.status(204).end();
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

    // favicon 등 정적 파일 요청은 무시
    if (url.includes(".ico") || url.includes(".png") || url.includes(".jpg") || url.includes(".svg")) {
      return res.status(404).end();
    }

    /** @type {string} */
    let template;
    /** @type {import('./src/main-server.tsx').render} */
    let render;
    if (!prod) {
      // Always read fresh template in development
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.tsx")).render;
    } else {
      template = templateHtml;
      render = (await import("./dist/react-ssr/main-server.js")).render;
    }
    const [pathname, search] = url.split("?");
    const query = new URLSearchParams(search || "");
    const queryObj = Object.fromEntries(query.entries());

    const finalUrl = pathname ? "/" + pathname : "/";

    const rendered = await render(finalUrl, queryObj);

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
    res.status(500).end(e.stack);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
