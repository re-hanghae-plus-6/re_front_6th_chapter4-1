import express from "express";
import fs from "fs";
import { mswServer } from "./src/mocks/serverHandlers.js";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5174;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

mswServer.listen({
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

    const url = req.originalUrl.replace(base, "");

    // // 쿼리 분리
    // const [pathname, search] = url.split("?");

    // // 경로 정규화 (빈 문자열이면 "/" 처리)
    // const normalizedPath = path.normalize(`/${pathname || ""}`);

    // // 쿼리 객체 변환
    // const query = Object.fromEntries(new URLSearchParams(search || "").entries());

    console.log("👉 SSR Input URL:", req.originalUrl);
    console.log("👉 base 제거 후:", url);
    // console.log("👉 normalizedPath:", normalizedPath);

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

    const rendered = await render(url || "/", req.query);
    // const rendered = await render(normalizedPath, query);

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
