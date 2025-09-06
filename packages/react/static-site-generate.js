import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateStaticSite() {
  console.log("Starting SSG generation...");

  try {
    // SSR 렌더 함수 import (빌드된 파일 사용)
    const { render } = await import("./dist/react-ssr/main-server.js");

    // 1. CSR 빌드 결과에서 index.html 템플릿 가져오기 (기본 빈 템플릿 사용)
    const templatePath = path.join(__dirname, "../../dist/react/index.html");
    let template = fs.readFileSync(templatePath, "utf-8");

    // 기존 SSR 렌더링 내용을 제거하고 플레이스홀더만 남기기
    template = template
      .replace(/<div id="root">.*?<\/div>/s, '<div id="root"><!--app-html--></div>')
      .replace(/<script>window\.__INITIAL_DATA__ = .*?;<\/script>/g, "")
      .replace(/<title>.*?<\/title>/g, "<!--app-head-->");

    // 2. 홈페이지 생성
    console.log("Generating home page...");
    const homeUrl = "/";
    const { html: homeHtml, head: homeHead, initialData: homeInitialData } = await render(homeUrl, {});

    const finalHomeHtml = template
      .replace("<!--app-html-->", homeHtml)
      .replace("<!--app-head-->", homeHead)
      .replace("</head>", `<script>window.__INITIAL_DATA__ = ${homeInitialData};</script></head>`);

    const homeOutputFile = path.join(__dirname, "../../dist/react/index.html");
    fs.writeFileSync(homeOutputFile, finalHomeHtml);
    console.log(`Generated ${homeOutputFile}`);

    // 3. items.json에서 실제 상품 ID들 가져오기
    const itemsPath = path.join(__dirname, "src/mocks/items.json");
    const items = JSON.parse(fs.readFileSync(itemsPath, "utf-8"));

    // 처음 10개 상품의 상세 페이지들 생성 (SSG 테스트용)
    const productIds = items.slice(0, 10).map((item) => item.productId);

    // 테스트에서 사용하는 특정 상품 ID들 추가
    const testProductIds = ["85067212996", "86940857379"];
    testProductIds.forEach((testId) => {
      if (!productIds.includes(testId)) {
        productIds.push(testId);
      }
    });

    for (const productId of productIds) {
      const productUrl = `/product/${productId}/`;
      console.log(`Generating SSG for ${productUrl}`);

      try {
        // SSR 렌더링으로 상품 상세 페이지 생성
        const { html: productHtml, head: productHead, initialData: productInitialData } = await render(productUrl, {});

        const finalProductHtml = template
          .replace("<!--app-html-->", productHtml)
          .replace("<!--app-head-->", productHead)
          .replace("</head>", `<script>window.__INITIAL_DATA__ = ${productInitialData};</script></head>`);

        // 상품 상세 페이지 저장
        const outputDir = path.join(__dirname, "../../dist/react", productUrl);
        const outputFile = path.join(outputDir, "index.html");

        // 디렉토리 생성
        fs.mkdirSync(outputDir, { recursive: true });

        // 파일 저장
        fs.writeFileSync(outputFile, finalProductHtml);
        console.log(`Generated ${outputFile}`);
      } catch (error) {
        console.error(`Failed to generate SSG for product ${productId}:`, error);

        // 에러 발생 시 기본 404 페이지 생성
        const {
          html: notFoundHtml,
          head: notFoundHead,
          initialData: notFoundInitialData,
        } = await render("/not-found", {});

        const finalNotFoundHtml = template
          .replace("<!--app-html-->", notFoundHtml)
          .replace("<!--app-head-->", notFoundHead)
          .replace("</head>", `<script>window.__INITIAL_DATA__ = ${notFoundInitialData};</script></head>`);

        const outputDir = path.join(__dirname, "../../dist/react", productUrl);
        const outputFile = path.join(outputDir, "index.html");

        fs.mkdirSync(outputDir, { recursive: true });
        fs.writeFileSync(outputFile, finalNotFoundHtml);
        console.log(`Generated fallback page for ${outputFile}`);
      }
    }

    // 4. 404 페이지 생성
    console.log("Generating 404 page...");
    const { html: notFoundHtml, head: notFoundHead, initialData: notFoundInitialData } = await render("/not-found", {});

    const final404Html = template
      .replace("<!--app-html-->", notFoundHtml)
      .replace("<!--app-head-->", notFoundHead)
      .replace("</head>", `<script>window.__INITIAL_DATA__ = ${notFoundInitialData};</script></head>`);

    const notFoundOutputFile = path.join(__dirname, "../../dist/react/404.html");
    fs.writeFileSync(notFoundOutputFile, final404Html);
    console.log(`Generated ${notFoundOutputFile}`);

    // 5. 몇 개의 카테고리 페이지도 생성 (선택적)
    const categories = [
      { category1: "생활/건강", category2: "생활용품" },
      { category1: "생활/건강", category2: "세제/세정제" },
    ];

    for (const category of categories) {
      const categoryUrl = `/?category1=${encodeURIComponent(category.category1)}&category2=${encodeURIComponent(category.category2)}`;
      console.log(`Generating category page for: ${categoryUrl}`);

      try {
        const {
          html: categoryHtml,
          head: categoryHead,
          initialData: categoryInitialData,
        } = await render(categoryUrl, {});

        const finalCategoryHtml = template
          .replace("<!--app-html-->", categoryHtml)
          .replace("<!--app-head-->", categoryHead)
          .replace("</head>", `<script>window.__INITIAL_DATA__ = ${categoryInitialData};</script></head>`);

        // 카테고리 페이지 저장 (파일명을 안전하게 변환)
        const safeCategoryName = `${category.category1}-${category.category2}`.replace(/[^a-zA-Z0-9가-힣]/g, "_");
        const categoryOutputFile = path.join(__dirname, `../../dist/react/${safeCategoryName}.html`);
        fs.writeFileSync(categoryOutputFile, finalCategoryHtml);
        console.log(`Generated ${categoryOutputFile}`);
      } catch (error) {
        console.error(`Failed to generate category page:`, error);
      }
    }

    console.log("SSG generation completed!");
    console.log(`Generated pages:`);
    console.log(`- Home page: /`);
    console.log(`- Product pages: ${productIds.length} pages`);
    console.log(`- Category pages: ${categories.length} pages`);
    console.log(`- 404 page`);
  } catch (error) {
    console.error("SSG generation failed:", error);
    process.exit(1);
  }
}

generateStaticSite();
