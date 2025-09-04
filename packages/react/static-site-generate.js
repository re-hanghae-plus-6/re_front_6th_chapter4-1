import { renderToString } from "react-dom/server";
import { createElement } from "react";
import fs from "fs";
import { render } from "./dist/react-ssr/main-server.js";

async function generateStaticSite() {
  // HTML 템플릿 읽기
  const template = fs.readFileSync("../../dist/react/index.html", "utf-8");

  try {
    // 홈페이지 렌더링
    const { html: appHtml, head, __INITIAL_DATA__ } = await render("/", {});

    // 초기 데이터 스크립트 생성
    const initialDataScript = __INITIAL_DATA__
      ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(__INITIAL_DATA__)}</script>`
      : "";

    // 결과 HTML 생성하기
    const result = template
      .replace("<!--app-head-->", head ?? "")
      .replace("<!--app-html-->", appHtml ?? "")
      .replace("<!-- app-data -->", initialDataScript);

    fs.writeFileSync("../../dist/react/index.html", result);

    // 주요 상품 상세 페이지들 미리 생성
    const productIds = ["85067212996", "86940857379", "82094468339", "86188464619"];

    for (const productId of productIds) {
      try {
        const productResult = await render(`/product/${productId}/`, {});

        // 상품별 초기 데이터 스크립트 생성
        const productInitialDataScript = productResult.__INITIAL_DATA__
          ? `<script>window.__INITIAL_DATA__ = ${JSON.stringify(productResult.__INITIAL_DATA__)}</script>`
          : "";

        // 상품 상세 페이지 HTML 생성
        const productHtml = template
          .replace("<!--app-head-->", productResult.head ?? "")
          .replace("<!--app-html-->", productResult.html ?? "")
          .replace("<!-- app-data -->", productInitialDataScript);

        // product 디렉토리 생성
        const productDir = `../../dist/react/product/${productId}`;
        fs.mkdirSync(productDir, { recursive: true });

        // index.html 파일 생성
        fs.writeFileSync(`${productDir}/index.html`, productHtml);

        console.log(`Generated static page for product ${productId}`);
      } catch (error) {
        console.warn(`Failed to generate static page for product ${productId}:`, error.message);
      }
    }
  } catch (error) {
    console.error("SSG generation failed, falling back to simple content:", error.message);

    // 어플리케이션 렌더링하기 (fallback)
    const appHtml = renderToString(createElement("div", null, "안녕하세요"));

    // 결과 HTML 생성하기
    const result = template.replace("<!--app-html-->", appHtml);
    fs.writeFileSync("../../dist/react/index.html", result);
  }
}

// 실행
generateStaticSite();
