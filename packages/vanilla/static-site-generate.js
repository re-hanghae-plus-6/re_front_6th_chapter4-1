// SSG(Static Site Generation) 스크립트
// 홈페이지와 상품 상세 페이지를 미리 생성하여 정적 파일로 저장
import fs from "fs/promises";
import { mswServer } from "./src/mocks/mswServer.js";
import items from "./src/mocks/items.json" with { type: "json" };

// 서버 사이드 렌더링 함수 가져오기
const { render } = await import("./dist/vanilla-ssr/main-server.js");

const BASE = "/front_6th_chapter4-1/vanilla/";

/**
 * 주어진 URL을 렌더링하여 HTML 파일로 생성
 * @param {string} url - 렌더링할 URL
 * @param {string} template - HTML 템플릿
 * @param {string} outFile - 출력 파일 경로
 */
async function writeRoute(url, template, outFile) {
  // SSR로 페이지 렌더링
  const { html, head, data } = await render(url, {});

  // 템플릿에 렌더링된 내용 삽입
  const result = template
    .replace(`<!--app-head-->`, head ?? "")
    .replace(`<!--app-data-->`, `<script>window.__INITIAL_DATA__ = ${data}</script>`)
    .replace(`<!--app-html-->`, html ?? "");

  await fs.writeFile(outFile, result, "utf-8");
}

/**
 * 정적 사이트 생성 메인 함수
 */
async function generateStaticSite() {
  // HTML 템플릿 읽기
  const templatePath = "../../dist/vanilla/index.html";
  const template = await fs.readFile(templatePath, "utf-8");

  // MSW 서버 시작 (API 요청 처리용)
  mswServer.listen({ onUnhandledRequest: "bypass" });

  try {
    // 홈페이지 생성 (루트 경로로 전달)
    await writeRoute(BASE, template, templatePath);

    // 상품 상세
    const productIds = items.slice(100, 130).map((p) => p.productId);
    const testItem = items.find((product) => product.productId === "86940857379");
    productIds.push(testItem.productId);

    // 각 상품별로 상세 페이지 생성
    for (const id of productIds) {
      const url = `${BASE}/product/${id}/`;
      const outDir = `../../dist/vanilla/product/${id}`;
      await fs.mkdir(outDir, { recursive: true });
      await writeRoute(url, template, `${outDir}/index.html`);
    }

    console.log("✅ SSG 실행 완료");
  } finally {
    // MSW 서버 종료
    mswServer.close();
  }
}

// SSG 실행
await generateStaticSite();
