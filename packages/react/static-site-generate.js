import fs from "fs";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { render } from "./dist/react-ssr/main-server.js";

// 미리 생성할 주요 상품 ID 목록
const PRODUCT_IDS = ["85067212996", "86940857379", "82094468339", "86188464619"];

// HTML 템플릿에 렌더링 결과를 주입하는 헬퍼 함수
function injectToTemplate(template, { html, head, __INITIAL_DATA__ }) {
  const initialDataScript = __INITIAL_DATA__
    ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(__INITIAL_DATA__)}</script>`
    : "";

  return template
    .replace("<!--app-head-->", head ?? "")
    .replace("<!--app-html-->", html ?? "")
    .replace("<!-- app-data -->", initialDataScript);
}

// 홈페이지 정적 파일 생성
async function generateHomePage(template) {
  console.log("🏠 홈페이지 생성 중...");
  const result = await render("/", {});
  const html = injectToTemplate(template, result);
  fs.writeFileSync("../../dist/react/index.html", html);
  console.log("✅ 홈페이지 생성 완료");
}

// 상품 상세 페이지 정적 파일 생성
async function generateProductPages(template) {
  console.log("📦 상품 상세 페이지 생성 중...");

  for (const productId of PRODUCT_IDS) {
    try {
      // 상품 데이터 렌더링
      const productResult = await render(`/product/${productId}/`, {});
      const productHtml = injectToTemplate(template, productResult);

      // 디렉토리 생성 및 HTML 파일 저장
      const productDir = `../../dist/react/product/${productId}`;
      fs.mkdirSync(productDir, { recursive: true });
      fs.writeFileSync(`${productDir}/index.html`, productHtml);

      console.log(`✅ 상품 ${productId} 페이지 생성 완료`);
    } catch (error) {
      console.warn(`⚠️ 상품 ${productId} 페이지 생성 실패:`, error.message);
    }
  }
}

// 폴백 페이지 생성 (렌더링 실패 시)
function generateFallbackPage(template) {
  console.log("🔄 폴백 페이지 생성 중...");
  const fallbackHtml = renderToString(createElement("div", null, "안녕하세요"));
  const result = template.replace("<!--app-html-->", fallbackHtml);
  fs.writeFileSync("../../dist/react/index.html", result);
  console.log("✅ 폴백 페이지 생성 완료");
}

// 메인 SSG 생성 함수
async function generateStaticSite() {
  console.log("🚀 정적 사이트 생성 시작");

  // HTML 템플릿 읽기
  const template = fs.readFileSync("../../dist/react/index.html", "utf-8");

  try {
    // 홈페이지 생성
    await generateHomePage(template);

    // 상품 상세 페이지들 생성
    await generateProductPages(template);

    console.log("🎉 정적 사이트 생성 완료!");
  } catch (error) {
    console.error("💥 SSG 생성 실패, 폴백으로 전환:", error.message);
    generateFallbackPage(template);
  }
}

// 실행
generateStaticSite();
