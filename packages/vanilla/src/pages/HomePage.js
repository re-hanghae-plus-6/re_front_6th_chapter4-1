import { ProductList, SearchBar } from "../components";
import { productStore } from "../stores";
import { router, withLifecycle } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";
import { PageWrapper } from "./PageWrapper.js";

const HomePageComponent = withLifecycle(
  {
    onMount: () => {
      // SSR 데이터가 있으면 로드하지 않음
      const currentState = productStore.getState();
      if (currentState.products.length === 0 && !currentState.loading) {
        loadProductsAndCategories();
      }
    },
    watches: [
      () => {
        const { search, limit, sort, category1, category2 } = router.query;
        return [search, limit, sort, category1, category2];
      },
      () => loadProducts(true),
    ],
  },
  ({ data, query } = {}) => {
    // SSR 데이터가 있으면 사용, 없으면 스토어 상태 사용
    const productState = data || productStore.getState();
    // SSR에서는 params.query 사용, 클라이언트에서는 router.query 사용
    const currentQuery = query || router.query;
    const { search: searchQuery, limit, sort, category1, category2 } = currentQuery;
    const { products, loading, error, totalCount, categories } = productState;
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

// SSR 메서드 - 로딩 상태 없이 완전한 데이터 반환
HomePageComponent.ssr = async ({ query }) => {
  const { getProducts, getCategories } = await import("../api/productApi.js");

  try {
    // SSR에서도 클라이언트와 동일한 정렬 기준 사용
    const queryWithSort = { ...query, sort: query.sort || "price_asc" };
    const [productsResponse, categories] = await Promise.all([getProducts(queryWithSort), getCategories()]);

    // SSR에서는 로딩 상태 없이 완전한 데이터만 반환
    return {
      products: productsResponse.products,
      categories,
      totalCount: productsResponse.pagination.total,
    };
  } catch (error) {
    console.error("홈페이지 SSR 데이터 로드 실패:", error);
    // 에러 발생 시에도 기본 데이터 구조 유지
    return {
      products: [],
      categories: {},
      totalCount: 0,
    };
  }
};

HomePageComponent.metadata = () => ({
  title: "쇼핑몰 - 상품 목록",
  description: "다양한 상품을 만나보세요",
});

export const HomePage = HomePageComponent;
