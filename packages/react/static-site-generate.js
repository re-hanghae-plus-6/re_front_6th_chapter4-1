import fs from "fs/promises";
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { render } from "./dist/react-ssr/main-server.js";

// 미리 생성할 주요 상품 ID 목록
const PRODUCT_IDS = ["85067212996", "86940857379", "82094468339", "86188464619"];

// HTML에 초기 데이터 스크립트를 삽입하는 유틸리티 함수
function createInitialDataScript(initialData) {
  return initialData ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)}</script>` : "";
}

// 템플릿에 렌더링 결과를 적용하는 함수
function applyRenderResult(template, renderResult) {
  const initialDataScript = createInitialDataScript(renderResult.__INITIAL_DATA__);

  return template
    .replace("<!--app-head-->", renderResult.head ?? "")
    .replace("<!--app-html-->", renderResult.html ?? "")
    .replace("<!-- app-data -->", initialDataScript);
}

// 단일 페이지를 생성하는 함수
async function generatePage(url, outputPath, template) {
  try {
    const renderResult = await render(url, {});
    const html = applyRenderResult(template, renderResult);

    // 출력 디렉토리 생성
    const outputDir = outputPath.substring(0, outputPath.lastIndexOf("/"));
    await fs.mkdir(outputDir, { recursive: true });

    await fs.writeFile(outputPath, html, "utf-8");
    return { success: true, url };
  } catch (error) {
    console.warn(`❌ 페이지 생성 실패 (${url}):`, error.message);
    return { success: false, url, error };
  }
}

// 폴백 페이지 생성 (렌더링 실패 시)
async function generateFallbackPage(template) {
  console.log("🔄 폴백 페이지 생성 중...");
  const fallbackHtml = renderToString(createElement("div", null, "안녕하세요"));
  const result = template.replace("<!--app-html-->", fallbackHtml);
  await fs.writeFile("../../dist/react/index.html", result);
  console.log("✅ 폴백 페이지 생성 완료");
}

// 메인 SSG 생성 함수
async function generateStaticSite() {
  try {
    console.log("🚀 정적 사이트 생성 시작");

    // HTML 템플릿 읽기
    const template = await fs.readFile("../../dist/react/index.html", "utf-8");

    // 홈페이지 생성
    console.log("🏠 홈페이지 생성 중...");
    const homeResult = await generatePage("/", "../../dist/react/index.html", template);

    if (homeResult.success) {
      console.log("✅ 홈페이지 생성 완료");
    }

    // 주요 상품 상세 페이지들 생성
    console.log(`📦 ${PRODUCT_IDS.length}개 상품 페이지 생성 중...`);

    // 상품 페이지들을 병렬로 생성
    const productTasks = PRODUCT_IDS.map((productId) => {
      const url = `/product/${productId}/`;
      const outputPath = `../../dist/react/product/${productId}/index.html`;
      return generatePage(url, outputPath, template);
    });

    const productResults = await Promise.all(productTasks);

    // 결과 집계
    const successful = productResults.filter((r) => r.success);
    const failed = productResults.filter((r) => !r.success);

    console.log(`✅ 상품 페이지 생성 완료: ${successful.length}/${PRODUCT_IDS.length}`);

    if (failed.length > 0) {
      console.log("❌ 생성 실패한 상품들:");
      failed.forEach((f) => console.log(`  - ${f.url}: ${f.error?.message}`));
    }

    console.log(`🎉 전체 생성 완료: 홈페이지 + ${successful.length}개 상품 페이지`);
  } catch (error) {
    console.error("💥 SSG 생성 실패, 폴백으로 전환:", error.message);
    try {
      const template = await fs.readFile("../../dist/react/index.html", "utf-8");
      await generateFallbackPage(template);
    } catch (fallbackError) {
      console.error("❌ 폴백 페이지 생성도 실패:", fallbackError.message);
      process.exit(1);
    }
  }
}

// 실행
await generateStaticSite();
