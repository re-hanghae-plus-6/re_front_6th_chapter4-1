import fs from "fs";
import { createServer } from "vite";

// Vite 개발 서버 생성 (SSR 모듈 로딩용)
const vite = await createServer({
  server: { middlewareMode: true }, // 미들웨어 모드로 설정
  appType: "custom", // 커스텀 앱 타입 설정
});

// MSW(Mock Service Worker) 서버 로드 및 시작
// SSR 환경에서 API 요청을 가로채기 위해 필요
const { server } = await vite.ssrLoadModule("/src/mocks/node.js");
server.listen();

// 상품 API 및 SSR 렌더링 함수 로드
// Vite의 SSR 모듈 로딩 기능을 활용
const { getProducts } = await vite.ssrLoadModule("/src/api/productApi.js");
const { render } = await vite.ssrLoadModule("/src/main-server.js");

// 빌드된 클라이언트 HTML 템플릿 로드
// 정적 페이지 생성 시 기본 구조로 사용
const template = fs.readFileSync("../../dist/vanilla/index.html", "utf-8");

/**
 * 단일 페이지를 정적으로 생성하는 비동기 함수
 * @param {string} url - 생성할 페이지의 URL 경로
 * @param {object} query - 페이지 렌더링에 필요한 쿼리 파라미터
 */
async function generateStaticSite(url, query) {
  // SSR 렌더링 함수를 통해 페이지 콘텐츠 및 초기 데이터 가져오기
  const rendered = await render(url, query);

  // HTML 템플릿에 SSR 결과 주입
  // head, html 콘텐츠 및 초기 데이터를 스크립트 태그로 삽입
  const html = template
    .replace(`<!--app-head-->`, rendered.head ?? "") // head 콘텐츠 치환
    .replace(`<!--app-html-->`, rendered.html ?? "") // app HTML 콘텐츠 치환
    .replace(
      `</head>`, // </head> 태그를 찾아 초기 데이터 스크립트와 함께 치환
      `
        <script>
          window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialData || {})};
        </script>
        </head>
      `,
    );

  // 생성된 HTML 파일을 파일 시스템에 저장
  if (url === "/404") {
    // 404 페이지는 별도 파일로 저장
    fs.writeFileSync("../../dist/vanilla/404.html", html);
  } else {
    // 동적 라우트의 경우, 해당 경로에 디렉토리 생성 후 index.html로 저장
    const outputPath = `../../dist/vanilla${url}`;
    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true }); // 디렉토리가 없으면 생성
    }
    fs.writeFileSync(`${outputPath}/index.html`, html); // index.html 파일로 저장
  }
}

// 모든 상품 목록을 가져와 동적 페이지 생성에 활용
const { products } = await getProducts();

// --- 정적 사이트 생성 실행 ---
// 메인 페이지 생성
await generateStaticSite("/", {});
// 404 페이지 생성
await generateStaticSite("/404", {});
// 각 상품 상세 페이지 생성
for (let i = 0; i < products.length; i++) {
  await generateStaticSite(`/product/${products[i].productId}/`, {});
}

// Vite 서버 종료
// 모든 정적 페이지 생성이 완료된 후 리소스 해제
vite.close();
