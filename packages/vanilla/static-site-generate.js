import fs from "node:fs";
import items from "./src/mocks/items.json" with { type: "json" };
import { createServer } from "vite";
import path from "node:path";
import { mswServer } from "./src/mocks/node.js";

mswServer.listen({
  onUnhandledRequest: "bypass",
});

// 서버 생성
const vite = await createServer({
  server: { middlewareMode: true },
  appType: "custom",
});

const { render } = await vite.ssrLoadModule("./src/main-server.js");

// 저장할 경로 생성 함수 ../../dist/vanilla/~
const joinDist = (...pathnames) => path.join("../../dist/vanilla", ...pathnames);

// dist/vanilla/index.html 파일 읽기. build:ssg 실행 전 client build가 선행되므로 index가 이미 존재
const template = fs.readFileSync(joinDist("/index.html"), "utf-8");

async function generateStaticSite(pathname) {
  // "/product/123/" → "../../dist/vanilla/product/123/index.html"
  const fullPathname = pathname.endsWith(".html") ? joinDist(pathname) : joinDist(pathname, "/index.html");
  const parsedPath = path.parse(fullPathname);

  // 기존 SSR 렌더러 호출 → { head, html, initialData } 반환
  const rendered = await render(pathname, {});

  const html = template
    .replace(`<!--app-head-->`, rendered.head ?? "") // <head> 안에 들어갈 내용
    .replace(`<!--app-html-->`, rendered.html ?? "") // <body> 안에 들어갈 내용
    .replace(`</head>`, `<script>window.__INITIAL_DATA__ = ${rendered.initialData};</script></head>`); // 초기 데이터 주입

  // 폴더가 존재하지 않는다면 만들기
  if (!fs.existsSync(parsedPath.dir)) {
    fs.mkdirSync(parsedPath.dir, { recursive: true });
  }

  // HTML 파일 저장
  fs.writeFileSync(fullPathname, html);
  console.log(`✅ ${pathname} 생성 완료`);
}

// 인기 상품 20개
const getProducts = ({ category2 } = {}) => {
  // 카테고리 필터링
  const filterByCategory = (data) => {
    if (category2) {
      return data.filter((v) => v.category2 === category2);
    }
    return data;
  };

  const products = filterByCategory(items);

  // 가격 낮은 순으로 상위 20개만 뽑기
  return {
    products: products.sort((a, b) => +a.lprice - +b.lprice).slice(0, 20),
    totalCount: products.length,
  };
};

console.log("🚀 SSG 생성 시작...");

await generateStaticSite("/404.html");

await generateStaticSite("/");

const { products } = getProducts();
for (const { productId } of products) {
  await generateStaticSite(`/product/${productId}/`);
}

vite.close();
console.log("🎉 SSG 생성 완료!");
console.log(`📊 총 ${2 + products.length}개 페이지 생성됨 (홈 + 404 + 상품 ${products.length}개)`);
