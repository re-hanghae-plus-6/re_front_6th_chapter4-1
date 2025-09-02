import express from "express";
import compression from "compression";
import sirv from "sirv";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

// HTML 템플릿 로드 및 분할
const template = readFileSync(join(__dirname, "index.html"), "utf-8");

const app = express();

// Express 미들웨어 설정
app.use(compression());
app.use(express.static("public"));

// 환경 분기
if (!prod) {
  // 개발 환경: Vite dev server
  const { createServer: createViteServer } = await import("vite");
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "custom",
  });

  // Vite의 미들웨어 사용
  app.use(vite.middlewares);

  // Vite 인스턴스를 res.locals에 저장
  app.use((req, res, next) => {
    res.locals.vite = vite;
    next();
  });
} else {
  // 프로덕션 환경: sirv로 정적 파일 서빙
  app.use(base, sirv("dist/vanilla", { extensions: [] }));
}

// 렌더링 파이프라인
app.use("*all", async (req, res) => {
  try {
    const url = req.originalUrl;

    let html = template;

    // 개발 환경에서 Vite transform 적용
    if (!prod) {
      const vite = res.locals.vite;
      if (vite) {
        html = await vite.transformIndexHtml(url, html);
      }
    }

    // 렌더링 데이터 - 테스트용
    const appHead = `<title>Vanilla Javascript SSR</title>`;

    // Template 치환
    const finalHtml = html.replace("<!--app-head-->", appHead).replace("<!--app-html-->", html);

    res.status(200).set({ "Content-Type": "text/html" }).end(finalHtml);
  } catch (e) {
    console.error(e.stack);
    res.status(500).end(e.stack);
  }
});

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
