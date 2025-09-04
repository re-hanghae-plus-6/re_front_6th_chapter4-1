import { HomePage, NotFoundPage, ProductDetailPageSSR } from "./pages/index.js";
import { router } from "./router/index.js";
import { getProductsOnServer, getUniqueCategories, getProductDetailOnServer } from "./mocks/server.js";

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

router.addRoute("/product/:id", () => {
  const productId = router.params.id;
  const productData = getProductDetailOnServer(productId);

  if (!productData) {
    return {
      initialData: { error: "상품을 찾을 수 없습니다." },
      html: NotFoundPage(),
      head: "<title>상품을 찾을 수 없습니다</title>",
    };
  }

  const { product, relatedProducts } = productData;

  return {
    initialData: {
      currentProduct: product,
      relatedProducts,
    },
    html: ProductDetailPageSSR({
      currentProduct: product,
      relatedProducts,
    }),
    head: `<title>${product.title} - 쇼핑몰</title>`,
  };
});

router.addRoute(".*", () => {
  return {
    initialData: {},
    html: NotFoundPage(),
    head: "<title>404</title>",
  };
});

export const render = async (url, query) => {
  console.log({ url, query });
  try {
    // 1. 서버 라우터에 쿼리 설정 (서버 사이드용)
    router.query = query;

    // 2. URL로 네비게이션하여 해당 라우트 찾기
    router.push(url);

    // 3. 현재 라우트의 핸들러가 있는지 확인
    if (!router.target) {
      throw new Error(`No route found for URL: ${url}`);
    }

    // 4. 핸들러 실행하여 렌더링 결과 얻기
    const result = router.target();

    return {
      ...result,
      data: JSON.stringify(result.initialData),
    };
  } catch (error) {
    console.error(error);
    return {
      initialData: { error: error.message },
      data: JSON.stringify({ error: error.message }),
      html: "<div>에러발생</div>",
      head: "<title>에러</title>",
    };
  }
};
