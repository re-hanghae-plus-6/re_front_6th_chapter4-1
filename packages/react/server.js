import express from "express";
import fs from "fs";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/react/" : "/");

const app = express();

const setupMiddlewares = async () => {
  if (!prod) {
    const { createServer } = await import("vite");
    const viteServer = await createServer({
      server: { middlewareMode: true },
      appType: "custom",
      base,
    });
    app.use(viteServer.middlewares);
    return viteServer;
  }
  const compression = (await import("compression")).default;
  app.use(compression());
  return null;
};

const viteServer = await setupMiddlewares();

const templateHtml = prod ? fs.readFileSync("./dist/react/index.html", "utf8") : "";

const get = {
  template: async (viteServer, url) => {
    if (prod) return templateHtml;

    const rawHtml = fs.readFileSync("./index.html", "utf-8");
    const transformedHtml = await viteServer.transformIndexHtml(url, rawHtml);
    return transformedHtml;
  },
  render: async (viteServer) => {
    if (prod) return (await import("./dist/react-ssr/main-server.js")).render;
    return (await viteServer.ssrLoadModule("/src/main-server.tsx")).render;
  },
};

app.use(async (request, response, next) => {
  try {
    const accept = request.headers.accept || "";
    if (!String(accept).includes("text/html")) return next();

    const url = request.originalUrl.replace(base, "");

    const template = await get.template(viteServer, url);
    const render = await get.render(viteServer);
    const { head, html, initialData, status = 200 } = await render(url, request.query ?? {});

    const initialDataScript = initialData
      ? `<script>window.__INITIAL_DATA__=${JSON.stringify(initialData).replace(/</g, "\\u003c")}</script>`
      : "";

    const finalHtml = template
      .replace(`<!--app-head-->`, head ?? "")
      .replace(`<!--app-html-->`, html ?? "")
      .replace("</head>", `${initialDataScript}</head>`);

    response.status(status).set({ "Content-Type": "text/html" }).send(finalHtml);
  } catch (error) {
    response.status(500).end(error.stack);
  }
});

if (prod) {
  const sirv = (await import("sirv")).default;
  app.use(base, sirv("./dist/react", { extensions: [] }));
}

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
