import compression from "compression";
import express from "express";
import fs from "fs";
import { dirname, join } from "path";
import sirv from "sirv";
import { fileURLToPath } from "url";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

const app = express();
app.use(compression());

if (prod) {
  // 프로덕션: 빌드된 정적 파일 서빙
  // compression + sirv 사용
  app.use(base, sirv("dist/vanilla", { dev: false }));
} else {
  // Vite dev server + middleware 사용
  const { createServer } = await import("vite");
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  app.use(vite.middlewares);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const templatePath = prod ? join(__dirname, base, "dist/vanilla/index.html") : join(__dirname, base, "index.html");

let template = fs.readFileSync(templatePath, "utf-8");

const render = async (url) => {
  // TODO: ServerRouter를 사용하여 라우팅 처리

  return template.replace("<!--app-html-->", `<div>hihi ${url}</div>`);
};

// Javascript, CSS, Image 등 정적 파일 서빙
app.use(base, sirv("dist/vanilla", { dev: false }));

// 초기 페이지 로드 시 서버에서 HTML 생성 - SSR
app.get("*all", async (req, res) => {
  const url = req.originalUrl.replace(base, "");
  const {
    html,
    head,
    // initialData
  } = await render(url);

  const finalHtml = template.replace("<!--app-html-->", html).replace("<!--app-head-->", head);

  res.send(finalHtml);
});

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
