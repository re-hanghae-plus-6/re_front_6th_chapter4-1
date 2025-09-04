import fs from "fs";
import express from "express";
import { server as mockServer } from "./src/mocks/node.js";

// --- Configuration ---
const isProduction = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (isProduction ? "/front_6th_chapter4-1/vanilla/" : "/");

// --- MSW Initialization ---
mockServer.listen({ onUnhandledRequest: "bypass" });

// --- Vite/Express Setup ---
async function createServer() {
  const app = express();
  let viteDevServer;

  if (isProduction) {
    const compression = (await import("compression")).default;
    const sirv = (await import("sirv")).default;
    app.use(compression());
    app.use(base, sirv("./dist/vanilla", { extensions: [] }));
  } else {
    const { createServer: createViteServer } = await import("vite");
    viteDevServer = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(viteDevServer.middlewares);
  }

  // --- SSR Middleware ---
  app.use("*", async (req, res) => {
    // Skip static assets
    if (req.originalUrl.match(/\.(ico|png|jpg|css|js)$|favicon/)) {
      return res.status(404).end();
    }

    try {
      const url = req.originalUrl.replace(base, "");

      let template;
      let render;

      if (isProduction) {
        template = fs.readFileSync("./dist/vanilla/index.html", "utf-8");
        render = (await import("./dist/vanilla-ssr/main-server.js")).render;
      } else {
        template = fs.readFileSync("./index.html", "utf-8");
        template = await viteDevServer.transformIndexHtml(url, template);
        render = (await viteDevServer.ssrLoadModule("/src/main-server.js")).render;
      }

      const ssrResult = await render(url, req.query);

      const finalHtml = template
        .replace(`<!--app-head-->`, ssrResult.head || "")
        .replace(`<!--app-html-->`, ssrResult.html || "SSR Failed")
        .replace(
          `<!--app-initial-data-->`,
          `<script>window.__INITIAL_DATA__ = ${JSON.stringify(ssrResult.initialData)}</script>`,
        );

      res.status(200).set({ "Content-Type": "text/html" }).send(finalHtml);
    } catch (e) {
      if (viteDevServer) {
        viteDevServer.ssrFixStacktrace(e);
      }
      console.error(e.stack);
      res.status(500).send(e.stack);
    }
  });

  return { app };
}

// --- Server Start ---
createServer().then(({ app }) => {
  app.listen(port, () => {
    console.log(`Vanilla SSR Server running at http://localhost:${port}`);
  });
});
