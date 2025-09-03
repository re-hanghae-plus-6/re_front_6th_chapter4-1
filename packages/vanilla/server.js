import express from "express";
import fs from "node:fs/promises";
import { mockServer } from "./src/mocks/server-mock.js";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

const templateHtml = prod ? await fs.readFile("dist/vanilla/index.html", "utf-8") : "";

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
  app.use(base, sirv("./dist/client", { extensions: [] }));
}

app.get("/api/products", async (req, res) => {
  try {
    const products = {
      products: [],
      pagination: { total: 0 },
    };
    res.json(products);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/categories", async (req, res) => {
  try {
    const categories = {};
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = { id: req.params.id };
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("*all", async (req, res) => {
  try {
    let template;
    let render;
    if (!prod) {
      template = await fs.readFile("./index.html", "utf-8"); //개발환경 루트경로 template으로 사용
      template = await vite.transformIndexHtml(req.url, template); //vite가 html을 읽고 변환

      render = (await vite.ssrLoadModule("./src/main-server.js")).render;
    } else {
      template = templateHtml;
      render = (await import("./dist/vanilla-ssr/main-server.js")).render;
    }
    const rendered = await render(req.originalUrl, req.query);
    const html = template
      .replace(`<!--app-head-->`, rendered.head ?? "")
      .replace(`<!--app-html-->`, rendered.html ?? "");

    res.status(200).set({ "Content-Type": "text/html" }).send(html);
  } catch (e) {
    vite?.ssrFixStacktrace(e);
    console.error(e);
    res.status(500).send(e.message);
  }
});

app.listen(port, () => {
  console.log(`Vanilla server running at http://localhost:${port}${base}`);
});
