import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ES 모듈에서 __dirname 대체
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 경로 상수
const DIST_DIR = path.resolve(__dirname, "../../dist/vanilla");
const SSR_DIR = path.resolve(__dirname, "src");

// 상품 데이터 가져오기
async function mockGetProducts({ limit = 20 }) {
  // 서버 모듈에서 상품 데이터 가져오기
  const serverModule = await import(path.join(SSR_DIR, "mocks/server.js"));
  const { getProductsOnServer } = serverModule;

  const result = getProductsOnServer({ limit });
  return result.products;
}

// 페이지 목록 생성
async function getPages() {
  const products = await mockGetProducts({ limit: 20 });

  return [
    { url: "/", filePath: path.join(DIST_DIR, "index.html") },
    { url: "/404", filePath: path.join(DIST_DIR, "404.html") },
    ...products.map((p) => ({
      url: `/product/${p.productId}/`,
      filePath: path.join(DIST_DIR, `product/${p.productId}/index.html`),
    })),
  ];
}

// HTML 파일 저장
async function saveHtmlFile(filePath, html) {
  // 디렉토리 생성
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 파일 저장
  fs.writeFileSync(filePath, html, "utf-8");
}

async function generateStaticSite() {
  try {
    console.log("SSG 시작...");

    // 1. 템플릿 + SSR 모듈 로드
    const templatePath = path.join(__dirname, "index.html");
    const template = fs.readFileSync(templatePath, "utf-8");

    // SSR 모듈 동적 import
    const ssrModule = await import(path.join(SSR_DIR, "main-server.js"));
    const { render } = ssrModule;

    // 2. 페이지 목록 생성
    const pages = await getPages();
    console.log(`${pages.length}개 페이지 생성 예정`);

    // 3. 각 페이지 렌더링 + 저장
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      console.log(`[${i + 1}/${pages.length}] ${page.url} 렌더링 중...`);

      try {
        // SSR 렌더링
        const result = await render(page.url);

        // HTML 템플릿에 데이터 삽입
        let html = template
          .replace("<!--app-html-->", result.html)
          .replace("<!--app-head-->", result.head || "")
          .replace("<!--app-data-->", `<script>window.__INITIAL_DATA__ = ${result.data};</script>`);

        // 파일 저장
        await saveHtmlFile(page.filePath, html);
        console.log(`✓ ${page.url} 완료`);
      } catch (error) {
        console.error(`✗ ${page.url} 렌더링 실패:`, error.message);
      }
    }

    console.log("SSG 완료!");
  } catch (error) {
    console.error("SSG 실패:", error);
    process.exit(1);
  }
}

// 실행
generateStaticSite();
