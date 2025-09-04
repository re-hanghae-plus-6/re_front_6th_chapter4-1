import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// NODE_ENV을 development로 설정 (BASE_URL을 빈 문자열로 사용하기 위해)
process.env.NODE_ENV = "development";

// Constants
const DIST_DIR = path.resolve(__dirname, "../../dist/vanilla");
const SSR_DIR = path.resolve(__dirname, "./dist/vanilla-ssr");

async function generateStaticSite() {
  console.log("🚀 Static Site Generation 시작...");

  try {
    // 1. 템플릿 HTML 로드
    const templatePath = path.join(DIST_DIR, "index.html");
    const template = await fs.readFile(templatePath, "utf-8");

    // 2. SSR 렌더 함수 로드
    const ssrModulePath = path.join(SSR_DIR, "main-server.js");

    const ssrModule = await import(`file://${ssrModulePath}`);
    const { render } = ssrModule;

    if (!render) {
      throw new Error("render 함수를 찾을 수 없습니다");
    }

    // 3. 생성할 페이지 목록 정의
    const pagesToGenerate = await getPages();

    // 4. 각 페이지별로 HTML 생성
    for (const page of pagesToGenerate) {
      try {
        const rendered = await render(page.url);

        // 서버 데이터를 클라이언트로 전달하기 위한 스크립트 생성
        const initialDataScript = rendered.initialData
          ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialData)};</script>`
          : "";

        const html = template
          .replace(`<!--app-head-->`, rendered.head ?? "")
          .replace(`<!--app-html-->`, rendered.html ?? "")
          .replace(`</head>`, `${initialDataScript}</head>`);

        // HTML 파일 저장
        await saveHtmlFile(page.filePath, html);
      } catch (error) {
        console.error(`❌ ${page.url} 생성 실패:`, error.message);
      }
    }
  } catch (error) {
    console.error("💥 SSG 실패:", error);
    process.exit(1);
  }
}

async function getPages() {
  const pages = [];

  // 홈페이지
  pages.push({
    url: "/",
    filePath: path.join(DIST_DIR, "index.html"),
  });

  // 404 페이지
  pages.push({
    url: "/404",
    filePath: path.join(DIST_DIR, "404.html"),
  });

  // 상품 상세 페이지들
  try {
    const { mockGetProducts } = await import("./src/mocks/server.js");
    const productsData = mockGetProducts({ limit: 20 }); // 20개의 상품 가져오기

    for (const product of productsData.products) {
      pages.push({
        url: `/product/${product.productId}/`,
        filePath: path.join(DIST_DIR, "product", product.productId, "index.html"),
      });
    }
  } catch (error) {
    console.error("상품 목록 로드 실패:", error);
  }

  return pages;
}

async function saveHtmlFile(filePath, html) {
  // 디렉토리 생성
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });

  // HTML 파일 저장
  await fs.writeFile(filePath, html, "utf-8");
}

// 실행
generateStaticSite().catch(console.error);
