import { getProductById, getProductsOnServer, getRelatedProducts, getUniqueCategories } from "./mocks/server.js";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { router } from "./router";

/**
 * 홈페이지 라우트 - 상품 목록과 카테고리 표시
 */
router.addRoute("/", () => {
  const {
    products,
    pagination: { total: totalCount },
  } = getProductsOnServer(router.query);
  const categories = getUniqueCategories();
  const results = { products, categories, totalCount };

  return {
    initialData: results,
    html: HomePage(results),
    head: "<title>쇼핑몰 - 홈</title>",
  };
});

/**
 * 상품 상세 페이지 라우트 - 상품 정보와 관련 상품 표시
 */
router.addRoute("/product/:id/", (params) => {
  const product = getProductById(params.id);

  // 존재하지 않는 상품인 경우
  if (!product) {
    return {
      initialData: {},
      html: NotFoundPage(),
      head: "<title>페이지 없음</title>",
    };
  }

  const relatedProducts = getRelatedProducts(product.category2, product.productId);

  return {
    initialData: { product, relatedProducts },
    html: ProductDetailPage({ product, relatedProducts }),
    head: `<title>${product.title} - 쇼핑몰</title>`,
  };
});

/**
 * 404 페이지 - 모든 매칭되지 않은 경로
 */
router.addRoute(".*", () => ({
  initialData: {},
  html: NotFoundPage(),
  head: "<title>페이지 없음</title>",
}));

/**
 * SSR 메인 렌더 함수 - URL과 쿼리를 받아 페이지 렌더링
 */
export const render = async (url, query) => {
  try {
    // 라우터 설정 및 시작
    router.setUrl(url, "http://localhost");
    router.query = query;
    router.start();

    // 라우트 찾기 및 핸들러 실행
    const routeInfo = router.findRoute(url);
    const result = await routeInfo.handler(routeInfo.params);
    console.log("✅ SSR 완료");

    return result;
  } catch (error) {
    console.error("❌ SSR 에러:", error);
    // 에러 발생 시 기본 에러 페이지 반환
    return {
      head: "<title>에러</title>",
      html: "<div>서버 오류가 발생했습니다.</div>",
      initialData: { error: error.message },
    };
  }
};
