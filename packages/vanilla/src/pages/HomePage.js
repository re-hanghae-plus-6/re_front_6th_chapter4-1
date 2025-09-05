import { getCategories, getProducts } from "../api/productApi.js";
import { ProductList, SearchBar } from "../components";
import { router, withLifecycle } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";
import { productStore } from "../stores/productStore.js";
import { isServer } from "../utils/envUtils.js";
import { PageWrapper } from "./PageWrapper.js";

export const HomePage = withLifecycle(
  {
    onMount: () => {
      loadProductsAndCategories();
    },
    watches: [
      () => {
        const { search, limit, sort, category1, category2 } = router.query;
        return [search, limit, sort, category1, category2];
      },
      () => loadProducts(true),
    ],
  },
  (serverData, query) => {
    // 서버에서 프리패치된 데이터가 있으면 사용, 없으면 스토어에서 가져옴
    const productState = productStore.getState();

    const { search: searchQuery, limit, sort, category1, category2 } = isServer ? query : router.query;
    // 서버 데이터 우선, 없으면 스토어 데이터 사용
    const products = serverData?.products || productState.products;
    const categories = serverData?.categories || productState.categories;
    const totalCount = serverData?.totalCount || productState.totalCount;
    const loading = serverData ? serverData.loading : productState.loading;
    const error = serverData ? serverData.error : productState.error;

    const category = { category1, category2 };
    const hasMore = products.length < totalCount;

    return PageWrapper({
      headerLeft: `
        <h1 class="text-xl font-bold text-gray-900">
          <a href="/" data-link>쇼핑몰</a>
        </h1>
      `.trim(),
      children: `
        <!-- 검색 및 필터 -->
        ${SearchBar({ searchQuery, limit, sort, category, categories })}
        
        <!-- 상품 목록 -->
        <div class="mb-6">
          ${ProductList({
            products,
            loading,
            error,
            totalCount,
            hasMore,
          })}
        </div>
      `.trim(),
    });
  },
);

HomePage.prefetch = async ({ query }) => {
  const [
    {
      products,
      pagination: { total },
    },
    categories,
  ] = await Promise.all([getProducts(query), getCategories()]);

  return {
    products,
    categories,
    totalCount: total,
    loading: false,
    status: "done",
  };
};

HomePage.meta = () => `<title>쇼핑몰 - 홈</title>`;
