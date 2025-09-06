import express from "express";

const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

const app = express();

let vite;
if (!prod) {
  // 개발환경이 아닐때 vite 서버를 미들웨어로 등록
  // 번들링된 파일 제공
  // HMR 제공
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });

  app.use(vite.middlewares);
} else {
  // 프로덕션 환경에서 정적 파일을 서빙

  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;
  // - HTTP 응답을 gzip/deflate로 압축하여 전송
  // - 네트워크 대역폭을 절약하고 로딩 속도 향상
  // - 프로덕션 환경에서 성능 최적화를 위해 사용
  app.use(compression());
  // - `sirv`: 정적 파일 서빙을 위한 고성능 미들웨어
  // - `"./dist/vanilla"`: 빌드된 정적 파일들이 위치한 디렉토리
  app.use(base, sirv("./dist/vanilla", { extensions: [] }));
}

const render = () => {
  return `<div>안녕하세요</div>`;
};

app.get("*all", (req, res) => {
  res.send(
    `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vanilla Javascript SSR</title>
  </head>
  <body>
  <div id="app">${render()}</div>
  </body>
  </html>
    `.trim(),
  );
});

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
});
