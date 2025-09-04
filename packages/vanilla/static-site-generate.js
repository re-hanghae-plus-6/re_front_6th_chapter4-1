import fs from "fs";
import { mockGetProducts } from "./src/mocks/mockApi.js";

const DIST_DIR = "../../dist/";
async function generateStaticSite() {
  // HTML 템플릿 읽기
  const template = fs.readFileSync(`${DIST_DIR}vanilla/index.html`, "utf-8");
  const { render } = await import("./src/main-server.js");

  // 어플리케이션 렌더링하기
  const appHtml = render();

  // 결과 HTML 생성하기
  const result = template.replace("<!--app-html-->", appHtml);
  fs.writeFileSync("../../dist/vanilla/index.html", result);
}

// 실행
generateStaticSite();

async function getPages() {
  const { products } = await mockGetProducts({ page: 1, limit: 20, sort: "price_asc" });

  return [
    { url: "/", filePath: `${DIST_DIR}vanilla/index.html` },
    { url: "/404", filePath: `${DIST_DIR}vanilla/404.html` },
    ...products.map((p) => ({
      url: `/product/${p.productId}/`,
      filePath: `${DIST_DIR}vanilla/product/${p.productId}/index.html`,
    })),
  ];
}

void getPages;
