import express from "express";
import fs from "fs";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

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
  const sirv = (await import("sirv")).default;

  app.use(compression());
  app.use(base, sirv("./dist/vanilla", { extensions: [] }));

  return null;
};

const viteServer = await setupMiddlewares();

const templateHtml = prod ? fs.readFileSync("./dist/vanilla/index.html", "utf8") : "";

const get = {
  template: async (viteServer, url) => {
    if (prod) return templateHtml;

    const rawHtml = fs.readFileSync("./index.html", "utf-8");
    const transformedHtml = await viteServer.transformIndexHtml(url, rawHtml);
    return transformedHtml;
  },
  render: async (viteServer) => {
    if (prod) return (await import("./dist/vanilla-ssr/main-server.js")).render;
    return (await viteServer.ssrLoadModule("/src/main-server.js")).render;
  },
};

app.get("*all", async (request, response) => {
  try {
    const url = request.originalUrl.replace(base, "");

    const template = await get.template(viteServer, url);
    const render = await get.render(viteServer);

    const { head, html } = await render(url);

    const finalHtml = template.replace(`<!--app-head-->`, head ?? "").replace(`<!--app-html-->`, html ?? "");

    response.status(200).set({ "Content-Type": "text/html" }).send(finalHtml);
  } catch (error) {
    response.status(500).end(error.stack);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
