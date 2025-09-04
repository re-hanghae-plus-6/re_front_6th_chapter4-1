import fs from "fs";
import path from "path";
import { render } from "./dist/vanilla-ssr/main-server.js";

async function generateStaticSite() {
  // HTML 템플릿 읽기
  const template = fs.readFileSync("../../dist/vanilla/index.html", "utf-8");

  // 홈페이지 렌더링
  const { html: appHtml, head, initialData } = await render("/", {});

  // 초기 데이터 스크립트 생성
  const initialDataScript = initialData
    ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)}</script>`
    : "";

  // 결과 HTML 생성하기
  const result = template
    .replace("<!--app-head-->", head ?? "")
    .replace("<!--app-html-->", appHtml ?? "")
    .replace("</head>", `${initialDataScript}</head>`);

  fs.writeFileSync("../../dist/vanilla/index.html", result);

  // 주요 상품 상세 페이지들 미리 생성
  const productIds = ["85067212996", "86940857379", "82094468339", "86188464619"];

  for (const productId of productIds) {
    try {
      const productResult = await render(`/product/${productId}/`, {});

      // 상품별 초기 데이터 스크립트 생성
      const productInitialDataScript = productResult.initialData
        ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(productResult.initialData)}</script>`
        : "";

      // 상품 상세 페이지 HTML 생성
      const productHtml = template
        .replace("<!--app-head-->", productResult.head ?? "")
        .replace("<!--app-html-->", productResult.html ?? "")
        .replace("</head>", `${productInitialDataScript}</head>`);

      // product 디렉토리 생성
      const productDir = `../../dist/vanilla/product/${productId}`;
      fs.mkdirSync(productDir, { recursive: true });

      // index.html 파일 생성
      fs.writeFileSync(`${productDir}/index.html`, productHtml);

      console.log(`Generated static page for product ${productId}`);
    } catch (error) {
      console.warn(`Failed to generate static page for product ${productId}:`, error.message);
    }
  }
}

// 실행
generateStaticSite();
