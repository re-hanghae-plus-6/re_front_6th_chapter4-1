// ===== 간단한 라우터 =====
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { router } from "./router";
import { getProductsOnServer, getUniqueCategories, getProductById, getRelatedProducts } from "./mocks/server.js";

// ===== 라우트 등록 =====
router.addRoute("/", () => {
  const {
    products,
    pagination: { total: totalCount },
  } = getProductsOnServer(router.query);
  const categories = getUniqueCategories();

  const results = {
    products,
    categories,
    totalCount,
  };

  return {
    initialData: results,
    html: HomePage(results),
    head: "<title>쇼핑몰 - 홈</title>",
  };
});
router.addRoute("/product/:id/", (params) => {
  const product = getProductById(params.id);

  if (!product) {
    return {
      initialData: {},
      html: NotFoundPage(),
      head: "<title>페이지 없음</title>",
    };
  }

  // 관련 상품 로드
  const relatedProducts = getRelatedProducts(product.category2, product.productId);

  return {
    initialData: { product, relatedProducts },
    html: ProductDetailPage({ product, relatedProducts }),
    head: `<title>${product.title} - 쇼핑몰</title>`,
  };
});
router.addRoute(".*", () => {
  return {
    initialData: {},
    html: NotFoundPage(),
    head: "<title>페이지 없음</title>",
  };
});

// ===== 메인 렌더 함수 =====
export const render = async (url, query) => {
  try {
    router.setUrl(url, "http://localhost");
    router.query = query;
    router.start();
    const routeInfo = router.findRoute(url);
    console.log(routeInfo);
    const result = await routeInfo.handler(routeInfo.params);
    console.log("✅ SSR 완료");

    return result;
  } catch (error) {
    console.error("❌ SSR 에러:", error);
    return {
      head: "<title>에러</title>",
      html: "<div>서버 오류가 발생했습니다.</div>",
      initialData: { error: error.message },
    };
  }
};
