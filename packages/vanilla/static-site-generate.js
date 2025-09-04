import fs from "fs";
import path from "path";
import { render } from "./dist/vanilla-ssr/main-server.js";
import { mockGetProducts } from "./src/api/serverApi.js";

async function generateStaticSite() {
  console.log("🏗️  Static Site Generation 시작...");

  // HTML 템플릿 읽기
  const templatePath = path.resolve("dist/vanilla/index.html");
  const template = fs.readFileSync(templatePath, "utf-8");

  // 1. 홈페이지 생성
  console.log("📄 홈페이지 생성 중...");
  const homeResult = await render("/");
  const homeHtml = template
    .replace("<!--app-head-->", `<title>${homeResult.head.title}</title>`)
    .replace("<!--app-html-->", homeResult.html)
    .replace("</head>", `<script>window.__INITIAL_DATA__ = ${JSON.stringify(homeResult.initialData)};</script></head>`);

  // 별도 index.html 파일로 저장 (원본 템플릿 보존)
  const homeIndexPath = path.resolve("../../dist/vanilla/index.html");
  fs.writeFileSync(homeIndexPath, homeHtml);
  console.log("✅ 홈페이지 생성 완료");

  // 2. 모든 상품 데이터 가져오기
  console.log("📦 상품 데이터 수집 중...");
  const allProducts = await mockGetProducts({ limit: 1000 }); // 모든 상품 가져오기
  console.log(`📊 총 ${allProducts.products.length}개 상품 발견`);

  // 3. 각 상품 상세 페이지 생성
  console.log("🔧 상품 상세 페이지들 생성 중...");

  // product 디렉토리 생성 (products가 아닌 product)
  const productsDir = path.resolve("../../dist/vanilla/product");
  if (!fs.existsSync(productsDir)) {
    fs.mkdirSync(productsDir, { recursive: true });
  }

  let generatedCount = 0;
  let errorCount = 0;

  // 순차 처리로 변경 (동시성 문제 방지)
  for (let i = 0; i < allProducts.products.length; i++) {
    const product = allProducts.products[i];
    try {
      const productUrl = `/product/${product.productId}/`;
      const productResult = await render(productUrl);

      const productHtml = template
        .replace("<!--app-head-->", `<title>${productResult.head.title}</title>`)
        .replace("<!--app-html-->", productResult.html)
        .replace(
          "</head>",
          `<script>window.__INITIAL_DATA__ = ${JSON.stringify(productResult.initialData)};</script></head>`,
        );

      // 상품별 디렉토리 생성
      const productDir = path.join(productsDir, product.productId);
      if (!fs.existsSync(productDir)) {
        fs.mkdirSync(productDir, { recursive: true });
      }

      // index.html 파일 생성
      const productFilePath = path.join(productDir, "index.html");
      fs.writeFileSync(productFilePath, productHtml);

      generatedCount++;
      if (generatedCount % 50 === 0) {
        console.log(`⏳ ${generatedCount}/${allProducts.products.length} 페이지 생성됨...`);
      }
    } catch (error) {
      errorCount++;
      console.error(`❌ 상품 ${product.productId} 페이지 생성 실패:`, error.message);
      // 처음 몇 개 오류는 자세히 출력
      if (errorCount <= 3) {
        console.error("Stack:", error.stack);
      }
    }
  }

  // 4. 404 페이지 생성
  console.log("🚫 404 페이지 생성 중...");
  const notFoundHtml = template
    .replace("<!--app-head-->", `<title>404 - 페이지를 찾을 수 없습니다</title>`)
    .replace(
      "<!--app-html-->",
      `
      <div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-6xl font-bold text-gray-400 mb-4">404</h1>
          <h2 class="text-2xl font-bold text-gray-900 mb-2">페이지를 찾을 수 없습니다</h2>
          <p class="text-gray-600 mb-6">요청하신 페이지가 존재하지 않습니다.</p>
          <a href="/" class="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 transition-colors">
            홈으로 돌아가기
          </a>
        </div>
      </div>
    `,
    )
    .replace("</head>", `<script>window.__INITIAL_DATA__ = null;</script></head>`);

  fs.writeFileSync(path.resolve("../../dist/vanilla/404.html"), notFoundHtml);

  console.log(`🎉 Static Site Generation 완료!`);
  console.log(`📊 총 ${generatedCount + 2}개 페이지 생성 (홈 1개 + 상품 ${generatedCount}개 + 404 1개)`);
  if (errorCount > 0) {
    console.log(`⚠️  ${errorCount}개 페이지 생성 실패`);
  }
  console.log(`📁 생성된 파일들:`);
  console.log(`   - /index.html (홈페이지)`);
  console.log(`   - /404.html (404 페이지)`);
  console.log(`   - /product/[productId]/index.html (상품 상세 페이지들)`);
}

// 실행
generateStaticSite().catch(console.error);
