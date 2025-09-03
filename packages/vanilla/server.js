import express from "express";
import sirv from "sirv";
import compression from "compression";
import { readFile, readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// 환경 설정
const prod = process.env.NODE_ENV === "production";
const port = process.env.PORT || 5173;
const base = process.env.BASE || (prod ? "/front_6th_chapter4-1/vanilla/" : "/");

// CommonJS (require 기반)에서는 Node.js가 자동으로 __dirname, __filename을 제공
// console.log(__dirname);  현재 파일이 있는 디렉토리
// console.log(__filename); 현재 파일 경로
// ESM (import/export 기반)**에서는 이 전역 변수가 제공되지 않아 import.meta.url 값을 사용하여 구현

// import.meta.url은 현재 모듈의 경로를 file URL 형태로 제공
// "file:///C:/Users/user/project/src/app.js"
// fileURLToPath는 Node.js url 모듈에서 제공하는 함수로, 이 file URL을 일반 파일 경로 문자열로 변환
// "C:\\Users\\user\\project\\src\\app.js"
const __filename = fileURLToPath(import.meta.url);

// path.dirname은 파일 경로에서 디렉토리 부분만 추출
// "C:\\Users\\user\\project\\src\\app.js" → "C:\\Users\\user\\project\\src"
const __dirname = dirname(__filename);

// HTML 템플릿 파일 읽기
// 학습 포인트: 서버 시작 시 한 번만 읽어서 메모리에 캐싱
// path.resolve는 인자로 받은 경로를 절대경로로 변환
// __dirname은 현재 파일이 위치한 디렉토리이고, "index.html"을 붙이면: C:\Users\user\project\src\index.html
const templatePath = resolve(__dirname, "index.html");

// 프로덕션 모드에서는 SSR에서 사용할 HTML 템플릿을 미리 읽어옵니다.(cached)
// 개발 모드에서는 빈 문자열('')로 두고, 요청 시마다 읽어서 최신 상태 유지.
const templateHtml = prod ? await readFile("./dist/vanilla/index.html", "utf-8") : "";
console.log(templateHtml);

// Express 앱 인스턴스 생성
const app = express();

let vite;
if (!prod) {
  // Vite 개발 서버를 middlewareMode로 생성.
  // middlewareMode: true: Express와 함께 Vite 미들웨어로 사용 가능.
  // vite.middlewares를 Express에 연결 → 개발 서버에서 JS/CSS HMR 제공.
  const { createServer } = await import("vite");
  vite = await createServer({
    server: { middlewareMode: true },
    appType: "custom",
    base,
  });
  app.use(vite.middlewares);
} else {
  //   compression : gzip 압축 미들웨어 → 네트워크 전송 최적화.
  // sirv : 정적 파일 제공 미들웨어.
  // ./dist/client 경로의 빌드 파일 제공.
  const compression = (await import("compression")).default;
  const sirv = (await import("sirv")).default;
  app.use(compression());
  app.use(base, sirv("./dist/vanilla", { extensions: [] }));
}

let template;

try {
  template = readFileSync(templatePath, "utf-8");
  console.log(`📄 HTML 템플릿 로드 성공: ${templatePath}`);
} catch (error) {
  console.error(`❌ HTML 템플릿 로드 실패: ${error.message}`);
  // 템플릿 파일이 없으면 기본 템플릿 사용
  template = `
    <!DOCTYPE html>
    <html lang="ko">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <!--app-head-->
    </head>
    <body>
      <div id="root"><!--app-html--></div>
    </body>
    </html>`;
}

// ===== 미들웨어 체인 설계 =====
// 학습 포인트: Express 미들웨어는 등록 순서대로 실행됩니다
// 1. 압축 미들웨어 (모든 응답을 압축하여 성능 최적화)
// 2. 정적 파일 서빙 미들웨어 (CSS, JS, 이미지 등 정적 자원 제공)
// 3. 개발 환경 전용 미들웨어 (Vite 개발 서버 연동)
// 4. SSR 라우트 핸들러 (모든 페이지 요청을 서버사이드 렌더링)

// 임시 렌더 함수 (나중에 main-server.js로 이동 예정)
// const render = () => {
//   return `<div>안녕하세요</div>`;
// };

// ===== 미들웨어 등록 시작 =====

// 1. 압축 미들웨어
// 학습 포인트: 모든 응답을 압축하여 네트워크 전송량 감소
app.use(
  compression({
    filter: (req, res) => {
      // 이미 압축된 파일은 제외
      if (req.headers["x-no-compression"]) {
        return false;
      }
      // compression 기본 필터 사용 (텍스트 기반 파일만 압축)
      return compression.filter(req, res);
    },
    level: 6, // 압축 레벨 (1-9, 6이 기본값)
    threshold: 1024, // 1KB 이상 파일만 압축
  }),
);

console.log(`🗜️ 압축 미들웨어 활성화`);

// 2. 정적 파일 서빙 미들웨어
// 학습 포인트: 정적 파일(CSS, JS, 이미지)을 먼저 처리해야 SSR과 충돌하지 않음
const staticDir = prod ? "dist/vanilla" : "public";
app.use(
  base,
  sirv(staticDir, {
    dev: !prod, // 개발 모드에서는 캐싱 비활성화
    etag: true, // ETag 헤더로 캐싱 최적화
    maxAge: prod ? 31536000 : 0, // 프로덕션에서는 1년 캐싱
  }),
);

console.log(`📁 정적 파일 디렉토리: ${staticDir}`);

// 3. 개발 환경 전용 미들웨어
if (!prod) {
  // 학습 포인트: 개발 환경에서만 실행되는 조건부 미들웨어
  console.log(`🔧 개발 모드: Vite 개발 서버 연동 준비`);

  // 개발 환경에서는 Vite가 HMR과 모듈 변환을 처리
  // 여기서는 추후 Vite 미들웨어 연동 예정
} else {
  // 프로덕션 환경에서는 추가 최적화 설정
  console.log(`🚀 프로덕션 모드: 최적화된 정적 파일 서빙`);
}

// 4. SSR 라우트 핸들러 (모든 페이지 요청)
app.get("*all", (req, res) => {
  // 학습 포인트: URL 파싱과 라우팅 정보 추출
  const url = req.originalUrl.replace(base, "");
  const query = req.query;

  console.log(`📝 요청 경로: ${req.path}`);
  console.log(`🔍 파싱된 URL: ${url}`);
  console.log(`❓ 쿼리 파라미터:`, query);

  // 라우트별 페이지 타이틀 설정
  let pageTitle = "Vanilla Javascript SSR";
  if (url === "/" || url === "") {
    pageTitle = "홈 - Vanilla SSR";
  } else if (url.startsWith("product/")) {
    const productId = url.split("product/")[1]?.split("/")[0];
    pageTitle = `상품 ${productId} - Vanilla SSR`;
  } else {
    pageTitle = "페이지를 찾을 수 없음 - Vanilla SSR";
  }

  console.log(`📋 페이지 타이틀: ${pageTitle}`);

  res.send(template);

  // res.send(
  //   `
  //     <!DOCTYPE html>
  //     <html lang="en">
  //     <head>
  //       <meta charset="UTF-8" />
  //       <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  //       <title>${pageTitle}</title>
  //     </head>
  //     <body>
  //       <div id="app">${render()}</div>
  //     </body>
  //     </html>
  //   `.trim(),
  // );
});

// Start http server
app.listen(port, () => {
  console.log(`React Server started at http://localhost:${port}`);
  console.log(`🚀 서버 모드: ${prod ? "프로덕션" : "개발"}`);
  console.log(`📁 베이스 경로: ${base}`);
});
