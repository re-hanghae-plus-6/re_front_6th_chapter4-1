import fs from "fs";
import { createElement } from "react";
import { renderToString } from "react-dom/server";

async function generateStaticSite() {
  // HTML 템플릿 읽기
  const template = fs.readFileSync("../../dist/react/index.html", "utf-8");

  // 어플리케이션 렌더링하기
  const appHtml = renderToString(createElement("div", null, "안녕하세요 SSG React"));

  // 결과 HTML 생성하기
  const result = template.replace("<!--app-html-->", appHtml);
  fs.writeFileSync("../../dist/react/index.html", result);
}

// 실행
generateStaticSite();
