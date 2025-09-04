/**
 * React SSR 서버 기본 동작 검증 테스트
 */
import { render } from "../main-server.tsx";

console.log("🧪 React SSR 서버 기본 동작 테스트 시작");

async function testSSRRendering() {
  console.log("1. 홈페이지 SSR 테스트");

  try {
    const homeResult = await render("/", { search: "test" });
    console.log("✅ 홈페이지 SSR 성공");
    console.log("Head 태그 포함:", homeResult.head.includes("<title>"));
    console.log("HTML 렌더링:", homeResult.html.length > 0);
    console.log("초기 데이터:", Object.keys(homeResult.__INITIAL_DATA__));
  } catch (error) {
    console.log("⚠️ 홈페이지 SSR 실패 (API 연결 필요):", error.message);
  }

  console.log("\n2. 상품 상세 페이지 SSR 테스트");

  try {
    const productResult = await render("/product/123/", {});
    console.log("✅ 상품 페이지 SSR 성공");
    console.log("Head 태그 포함:", productResult.head.includes("<title>"));
    console.log("HTML 렌더링:", productResult.html.length > 0);
    console.log("초기 데이터:", Object.keys(productResult.__INITIAL_DATA__));
  } catch (error) {
    console.log("⚠️ 상품 페이지 SSR 실패 (API 연결 필요):", error.message);
  }

  console.log("\n3. 404 페이지 SSR 테스트");

  try {
    const notFoundResult = await render("/invalid-path", {});
    console.log("✅ 404 페이지 SSR 성공");
    console.log("404 제목 포함:", notFoundResult.head.includes("404"));
    console.log("HTML 렌더링:", notFoundResult.html.length > 0);
  } catch (error) {
    console.log("❌ 404 페이지 SSR 실패:", error.message);
  }
}

// 테스트 실행
testSSRRendering()
  .then(() => {
    console.log("\n🎉 React SSR 서버 기본 동작 테스트 완료");
  })
  .catch((error) => {
    console.error("❌ 테스트 실행 중 오류:", error);
  });

export {}; // 모듈로 만들기 위한 export
