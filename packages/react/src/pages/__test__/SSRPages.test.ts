/**
 * 페이지 컴포넌트들의 SSR 메서드 검증 테스트
 */
import { HomePage, ProductDetailPage, NotFoundPage } from "../index";
import type { SSRPageComponent } from "../../types/ssr";

console.log("🧪 페이지 컴포넌트 SSR 메서드 검증 시작");

// 테스트용 더미 컨텍스트
const mockHomeContext = {
  params: {},
  query: { search: "test", sort: "price_asc" },
};

const mockProductContext = {
  params: { id: "123" },
  query: {},
};

const mockNotFoundContext = {
  params: {},
  query: {},
};

async function testSSRMethods() {
  console.log("1. HomePage SSR 메서드 테스트");

  // HomePage SSR 메서드 존재 확인
  const homePageSSR = (HomePage as SSRPageComponent).ssr;
  if (homePageSSR) {
    console.log("✅ HomePage.ssr 메서드 존재");

    try {
      const homeData = await homePageSSR(mockHomeContext);
      console.log("✅ HomePage SSR 메서드 호출 성공");
      console.log("데이터 구조:", Object.keys(homeData));
    } catch (error) {
      console.log(
        "⚠️ HomePage SSR 메서드 호출 실패 (API 연결 필요):",
        error instanceof Error ? error.message : String(error),
      );
    }
  } else {
    console.log("❌ HomePage.ssr 메서드 없음");
  }

  // HomePage 메타데이터 메서드 확인
  const homePageMetadata = (HomePage as SSRPageComponent).metadata;
  if (homePageMetadata) {
    console.log("✅ HomePage.metadata 메서드 존재");
    const metadata = homePageMetadata({ query: mockHomeContext.query });
    console.log("홈페이지 메타데이터:", metadata);
  } else {
    console.log("❌ HomePage.metadata 메서드 없음");
  }

  console.log("\n2. ProductDetailPage SSR 메서드 테스트");

  // ProductDetailPage SSR 메서드 존재 확인
  const productPageSSR = (ProductDetailPage as SSRPageComponent).ssr;
  if (productPageSSR) {
    console.log("✅ ProductDetailPage.ssr 메서드 존재");

    try {
      const productData = await productPageSSR(mockProductContext);
      console.log("✅ ProductDetailPage SSR 메서드 호출 성공");
      console.log("데이터 구조:", Object.keys(productData));
    } catch (error) {
      console.log(
        "⚠️ ProductDetailPage SSR 메서드 호출 실패 (API 연결 필요):",
        error instanceof Error ? error.message : String(error),
      );
    }
  } else {
    console.log("❌ ProductDetailPage.ssr 메서드 없음");
  }

  // ProductDetailPage 메타데이터 메서드 확인
  const productPageMetadata = (ProductDetailPage as SSRPageComponent).metadata;
  if (productPageMetadata) {
    console.log("✅ ProductDetailPage.metadata 메서드 존재");
    const metadata = productPageMetadata();
    console.log("상품 페이지 기본 메타데이터:", metadata);
  } else {
    console.log("❌ ProductDetailPage.metadata 메서드 없음");
  }

  console.log("\n3. NotFoundPage SSR 메서드 테스트");

  // NotFoundPage SSR 메서드 존재 확인
  const notFoundPageSSR = (NotFoundPage as SSRPageComponent).ssr;
  if (notFoundPageSSR) {
    console.log("✅ NotFoundPage.ssr 메서드 존재");

    try {
      const notFoundData = await notFoundPageSSR(mockNotFoundContext);
      console.log("✅ NotFoundPage SSR 메서드 호출 성공");
      console.log("데이터 구조:", Object.keys(notFoundData));
    } catch (error) {
      console.log("❌ NotFoundPage SSR 메서드 호출 실패:", error instanceof Error ? error.message : String(error));
    }
  } else {
    console.log("❌ NotFoundPage.ssr 메서드 없음");
  }

  // NotFoundPage 메타데이터 메서드 확인
  const notFoundPageMetadata = (NotFoundPage as SSRPageComponent).metadata;
  if (notFoundPageMetadata) {
    console.log("✅ NotFoundPage.metadata 메서드 존재");
    const metadata = notFoundPageMetadata();
    console.log("404 페이지 메타데이터:", metadata);
  } else {
    console.log("❌ NotFoundPage.metadata 메서드 없음");
  }
}

// 테스트 실행
testSSRMethods()
  .then(() => {
    console.log("\n🎉 페이지 컴포넌트 SSR 메서드 검증 완료");
  })
  .catch((error) => {
    console.error("❌ 테스트 실행 중 오류:", error);
  });

export {}; // 모듈로 만들기 위한 export
