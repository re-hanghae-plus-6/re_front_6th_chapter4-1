import fs from "fs";
import path from "path";
import { getProducts } from "./src/api/routes.js";

const DIST_DIR = "../../dist/vanilla";
const SSG_SERVER_DIR = "./dist/vanilla-ssr";

async function generateStaticSite() {
  try {
    // HTML 템플릿 읽기
    const template = fs.readFileSync(`${DIST_DIR}/index.html`, "utf-8");

    // SSR 렌더 함수 로드
    const { render } = await import(`${SSG_SERVER_DIR}/main-server.js`);

    // 생성할 페이지 목록
    const pages = await getPages();

    console.log(`Generating ${pages.length} static pages...`);

    // 각 페이지 생성
    for (const page of pages) {
      console.log(`Generating: ${page.url}`);

      // 렌더링
      const rendered = await render(page.url);

      // HTML 생성
      const html = template
        .replace("<!--app-head-->", rendered.head || "")
        .replace("<!--app-html-->", rendered.html || "")
        .replace(
          "</body>",
          `<script>window.__INITIAL_DATA__ = ${JSON.stringify(rendered.initialData || {})};</script></body>`,
        );

      // 파일 저장
      await saveHtmlFile(page.filePath, html);
    }

    console.log("✅ Static site generation completed!");
  } catch (error) {
    console.error("❌ Static site generation failed:", error);
    process.exit(1);
  }
}

// 생성할 페이지 목록 조회
async function getPages() {
  const pages = [];

  // 홈페이지
  pages.push({
    url: "/",
    filePath: `${DIST_DIR}/index.html`,
  });

  // 404 페이지
  pages.push({
    url: "/404",
    filePath: `${DIST_DIR}/404.html`,
  });

  // 상품 상세 페이지들 (처음 20개)
  try {
    const productsData = await getProducts({ limit: 20 });
    for (const product of productsData.products) {
      pages.push({
        url: `/product/${product.productId}/`,
        filePath: `${DIST_DIR}/product/${product.productId}/index.html`,
      });
    }
  } catch (error) {
    console.warn("Warning: Could not load products for SSG:", error.message);
  }

  return pages;
}

// HTML 파일 저장
async function saveHtmlFile(filePath, html) {
  const dir = path.dirname(filePath);

  // 디렉토리 생성
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  // 파일 저장
  fs.writeFileSync(filePath, html, "utf-8");
}

// 실행
generateStaticSite();
