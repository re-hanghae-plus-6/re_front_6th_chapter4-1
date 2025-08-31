import fs from "fs";

const render = () => {
  return `<div>안녕하세요 SSG</div>`;
};

async function generateStaticSite() {
  // HTML 템플릿 읽기
  const template = fs.readFileSync("../../dist/vanilla/index.html", "utf-8");

  // 어플리케이션 렌더링하기
  const appHtml = render();

  // 결과 HTML 생성하기
  const result = template.replace("<!--app-html-->", appHtml);
  fs.writeFileSync("../../dist/vanilla/index.html", result);
}

// 실행
generateStaticSite();
