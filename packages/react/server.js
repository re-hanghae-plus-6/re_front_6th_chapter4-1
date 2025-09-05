import express from "express";
const { createServer } = await import("vite");
import fs from "fs";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/react/" : "/");

const templateHtml = prod ? fs.readFileSync("./dist/react/index.html", "utf-8") : "";

const vite = await createServer({
  // plugins: [react()],
  server: { middlewareMode: true },
  appType: "custom",
  base,
});

const { mswServer } = await vite.ssrLoadModule("./src/mocks/serverHandlers.ts");

mswServer.listen({
  onUnhandledRequest: "bypass",
});

const app = express();

if (!prod) {
  app.use(vite.middlewares);
} else {
  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;
  app.use(compression());
  app.use(base, sirv("dist/react", { extensions: [] }));
}

app.get("*all", async (req, res) => {
  try {
    // 정적 파일 요청은 SSR 제외
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
    console.log("req.originalUrl", req.originalUrl);
    const url = req.originalUrl.replace(base, "/");
    console.log("👉 서버에 들어온 url", url);
    let template;
    let render;
    if (!prod) {
      console.log("👉 dev");
      template = fs.readFileSync("./index.html", "utf-8");
      template = await vite.transformIndexHtml(url, template);
      render = (await vite.ssrLoadModule("/src/main-server.tsx")).render;
    } else {
      console.log("👉 prod");
      template = templateHtml;
      render = (await import("./dist/react-ssr/main-server.tsx")).render;
    }
    const rendered = await render(url);

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
