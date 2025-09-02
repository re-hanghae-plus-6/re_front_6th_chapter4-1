import { ServerRouter } from "./lib";
import { getProducts, getProduct, getCategories } from "./api/productApi.js";
import { HomeView } from "./pages/HomePage.js";
import { ProductDetailView } from "./pages/ProductDetailPage.js";

// 서버용 라우트 설정 (데이터 페칭 포함)
const serverRouter = new ServerRouter({
  "/": async (params, query) => {
    const [productsData, categories] = await Promise.all([getProducts(query), getCategories()]);
    const products = productsData.products;
    const totalCount = productsData.pagination.total;
    const { search: searchQuery, limit, sort, category1, category2 } = query ?? {};
    const category = { category1, category2 };
    const hasMore = products.length < totalCount;

    const html = HomeView({
      products,
      loading: false,
      error: null,
      totalCount,
      hasMore,
      searchQuery,
      limit,
      sort,
      category,
      categories,
    });

    return {
      head: `<title>쇼핑몰 - 홈</title>`,
      html,
      data: { products, categories, totalCount },
    };
  },
  "/product/:id/": async (params) => {
    const product = await getProduct(params.id);
    let relatedProducts = [];
    if (product?.category2) {
      try {
        const resp = await getProducts({ category2: product.category2, limit: 20, page: 1 });
        relatedProducts = (resp.products ?? []).filter((p) => p.productId !== product.productId);
      } catch {
        relatedProducts = [];
      }
    }

    const html = ProductDetailView({ product, relatedProducts, error: null, loading: false });
    return {
      head: `<title>${product.title} - 쇼핑몰</title>`,
      html,
      data: { currentProduct: product, relatedProducts },
    };
  },
});

export const render = async (url) => {
  console.log(url);

  // 1단계: URL 매칭
  const route = serverRouter.match(url);

  if (route) {
    // 2단계: 실제 페이지 함수 호출 (데이터 페칭 포함)
    const result = await route.handler(route.params, route.query);

    return {
      head: result.head,
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
