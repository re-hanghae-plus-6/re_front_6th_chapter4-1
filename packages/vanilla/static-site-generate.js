import fs from "fs";
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
}

// 실행
generateStaticSite();
