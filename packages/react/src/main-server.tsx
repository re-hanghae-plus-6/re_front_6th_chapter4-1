import { renderToString } from "react-dom/server";
import { ServerRouter } from "./router/ServerRouter";
import { getProductById, getProductsOnServer, getRelatedProducts, getUniqueCategories } from "./mocks/server";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { productStore, PRODUCT_ACTIONS } from "./entities/products/productStore";

// 서버 라우터 인스턴스
const serverRouter = new ServerRouter();

/**
 * 홈페이지 라우트 - 상품 목록과 카테고리 표시
 */
serverRouter.addRoute("/", () => {
  const {
    products,
    pagination: { total: totalCount },
  } = getProductsOnServer(serverRouter.query);
  const categories = getUniqueCategories();
  const results = { products, categories, totalCount };

  // 스토어에 데이터 저장
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SET_PRODUCTS,
    payload: { products, totalCount },
  });
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SET_CATEGORIES,
    payload: categories,
  });

  return {
    initialData: results,
    html: renderToString(<HomePage />),
    head: "<title>쇼핑몰 - 홈</title>",
  };
});

/**
 * 상품 상세 페이지 라우트 - 상품 정보와 관련 상품 표시
 */
serverRouter.addRoute("/product/:id/", (params?: { id: string }) => {
  const product = getProductById(params?.id || "");

  // 존재하지 않는 상품인 경우
  if (!product) {
    return {
      initialData: {},
      html: renderToString(<NotFoundPage />),
      head: "<title>페이지 없음</title>",
    };
  }

  const relatedProducts = getRelatedProducts(product.category2, product.productId);

  // 스토어에 데이터 저장
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
    payload: product,
  });
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
    payload: relatedProducts,
  });

  return {
    initialData: { product, relatedProducts },
    html: renderToString(<ProductDetailPage />),
    head: `<title>${product.title} - 쇼핑몰</title>`,
  };
});

/**
 * 404 페이지 - 모든 매칭되지 않은 경로
 */
serverRouter.addRoute(".*", () => ({
  initialData: {},
  html: renderToString(<NotFoundPage />),
  head: "<title>페이지 없음</title>",
}));

/**
 * SSR 메인 렌더 함수 - URL과 쿼리를 받아 페이지 렌더링
 */
export const render = async (url: string, query: Record<string, string>) => {
  try {
    // 라우터 설정 및 시작
    serverRouter.setUrl(url, "http://localhost");
    serverRouter.query = query;
    serverRouter.start();

    // 라우트 찾기 및 핸들러 실행
    const routeInfo = serverRouter.findRoute(url);
    if (!routeInfo) {
      throw new Error(`Route not found for URL: ${url}`);
    }
    const result = await routeInfo.handler(routeInfo.params);
    console.log("✅ SSR 완료");

    return result;
  } catch (error) {
    console.error("❌ SSR 에러:", error);
    // 에러 발생 시 기본 에러 페이지 반환
    return {
      head: "<title>에러</title>",
      html: renderToString(<NotFoundPage />),
      initialData: { error: (error as Error).message },
    };
  }
};
