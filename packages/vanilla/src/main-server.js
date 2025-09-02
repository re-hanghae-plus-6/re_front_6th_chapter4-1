import { ServerRouter } from "./lib";
import { getProducts, getProduct, getCategories } from "./api/productApi.js";

// 서버용 라우트 설정 (데이터 페칭 포함)
const serverRouter = new ServerRouter({
  "/": async (params, query) => {
    const [productsData, categories] = await Promise.all([getProducts(query), getCategories()]);

    return {
      html: `<div>홈페이지 - 상품 ${productsData.products.length}개</div>`,
      data: { products: productsData.products, categories, totalCount: productsData.pagination.total },
    };
  },
  "/product/:id/": async (params) => {
    const product = await getProduct(params.id);

    return {
      html: `<div>상품페이지 - ${product.title}</div>`,
      data: { currentProduct: product },
    };
  },
});

export const render = async (url, query) => {
  console.log({ url, query });

  // 1단계: URL 매칭
  const route = serverRouter.match(url);

  if (route) {
    // 2단계: 실제 페이지 함수 호출 (데이터 페칭 포함)
    const result = await route.handler(route.params, route.query);

    return {
      head: "",
      html: result.html,
      initialData: result.data ? JSON.stringify(result.data) : null,
    };
  } else {
    return {
      head: "",
      html: "<div>404 페이지를 찾을 수 없습니다</div>",
      initialData: null,
    };
  }
};
