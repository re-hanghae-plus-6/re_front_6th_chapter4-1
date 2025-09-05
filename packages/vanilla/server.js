import fs from "node:fs/promises";
import express from "express";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

// Cached production assets
const templateHtml = prod ? await fs.readFile("./dist/vanilla/index.html", "utf-8") : "";

const app = express();

// Add Vite or respective production middlewares
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

  // Mock server setup for development
  const { server } = await vite.ssrLoadModule("/src/mocks/serverBrowser.js");
  server.listen();
} else {
  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;
  app.use(compression());
  app.use(base, sirv("./dist/vanilla", { extensions: [] }));
}

// use , get 차이점
// use 는 모든 요청에 대해 실행되고, get 은 특정 요청에 대해 실행됩니다.
app.use("*all", async (req, res) => {
  try {
    const url = req.originalUrl.replace(base, "");
    /** @type {string} */
    let template;
    /** @type {import('./src/main-server.js').render} */
    let render;
    if (!prod) {
      // Always read fresh template in development
      template = await fs.readFile("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.js")).render;
    } else {
      template = templateHtml;
      render = (await import("./dist/vanilla-ssr/main-server.js")).render;
    }

    // server에 있는 값을 전달해주기 위해서 인자로 넘겨줘야함.
    const rendered = await render(url, req.query);

    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? "")
      .replace(`<!--app-html-->`, rendered.html ?? "")
      .replace(
        `</head>`,
        `
        <script>
          window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialData || {})};
        </script>
        </head>
      `,
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
