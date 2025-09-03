import fs from "fs";
import path from "path";

// 서버용 렌더링 함수 import
const { render } = await import("./dist/vanilla-ssr/main-server.js");

// 메타태그 생성 함수
function generateHead(title, description = "") {
  return `
    <title>${title}</title>
    <meta name="description" content="${description}">
  `;
}

// HTML 템플릿에서 플레이스홀더 교체
function replacePlaceholders(template, html, head, initialData) {
  return template
    .replace("<!--app-head-->", head)
    .replace("<!--app-html-->", html)
    .replace("<!--app-data-->", `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)};</script>`);
}

// 디렉토리 생성 함수
function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function generateStaticSite() {
  try {
    console.log("🚀 SSG 시작...");

    // HTML 템플릿 읽기
    const template = fs.readFileSync("../../dist/vanilla/index.html", "utf-8");
    console.log("✅ HTML 템플릿 로드 완료");

    // 1. 홈페이지 생성
    console.log("📄 홈페이지 생성 중...");
    const homeResult = await render("/", {});
    const homeHtml = replacePlaceholders(
      template,
      homeResult.html,
      generateHead("쇼핑몰 - 홈", "다양한 상품을 만나보세요"),
      homeResult.initialData,
    );
    fs.writeFileSync("../../dist/vanilla/index.html", homeHtml);
    console.log("✅ 홈페이지 생성 완료");

    // 2. 404 페이지 생성
    console.log("📄 404 페이지 생성 중...");
    const notFoundResult = await render("/404", {});
    const notFoundHtml = replacePlaceholders(
      template,
      notFoundResult.html,
      generateHead("페이지를 찾을 수 없습니다 - 쇼핑몰"),
      notFoundResult.initialData,
    );
    fs.writeFileSync("../../dist/vanilla/404.html", notFoundHtml);
    console.log("✅ 404 페이지 생성 완료");

    // 3. 상품 상세 페이지들 생성
    console.log("📄 상품 상세 페이지들 생성 중...");

    // 모든 상품 데이터 직접 로드
    const itemsPath = path.join(process.cwd(), "src/mocks/items.json");
    const items = JSON.parse(fs.readFileSync(itemsPath, "utf-8"));
    const products = items; // 모든 상품 사용

    if (products && products.length > 0) {
      // 상품별 디렉토리 생성 및 HTML 파일 생성
      for (const product of products) {
        const productId = product.productId;
        const productUrl = `/product/${productId}/`;

        console.log(`📦 상품 ${productId} 페이지 생성 중...`);

        const productResult = await render(productUrl, {});

        if (productResult.initialData.currentProduct) {
          const productHtml = replacePlaceholders(
            template,
            productResult.html,
            generateHead(`${product.title} - 쇼핑몰`, product.title),
            productResult.initialData,
          );

          // 상품별 디렉토리 생성
          const productDir = `../../dist/vanilla/product/${productId}`;
          const productFilePath = `${productDir}/index.html`;

          // 디렉토리 생성
          ensureDirectoryExists(productFilePath);

          // index.html 파일 생성
          fs.writeFileSync(productFilePath, productHtml);
          console.log(`✅ 상품 ${productId} 페이지 생성 완료`);
        }
      }
    }

    console.log("🎉 SSG 완료!");
    console.log(`📊 생성된 페이지:`);
    console.log(`  - 홈페이지: ../../dist/vanilla/index.html`);
    console.log(`  - 404 페이지: ../../dist/vanilla/404.html`);
    console.log(`  - 상품 상세 페이지: ../../dist/vanilla/product/*/index.html`);
  } catch (error) {
    console.error("❌ SSG 오류:", error);
    throw error;
  }
}

// 실행
generateStaticSite();
