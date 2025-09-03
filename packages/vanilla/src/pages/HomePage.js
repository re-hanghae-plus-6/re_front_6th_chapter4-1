import { ProductList, SearchBar } from "../components";
import { productStore } from "../stores";
import { router, withLifecycle } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";
import { PageWrapper } from "./PageWrapper.js";

const HomePageComponent = withLifecycle(
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
  () => {
    const productState = productStore.getState();
    const { search: searchQuery, limit, sort, category1, category2 } = router.query;
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

// SSR 메서드 - 로딩 상태 없이 완전한 데이터만 반환
HomePageComponent.ssr = async ({ query }) => {
  const { getProducts, getCategories } = await import("../api/productApi.js");

  try {
    // SSR에서는 항상 완전한 데이터를 받아온 후 렌더링
    const queryWithSort = { ...query, sort: query.sort || "price_asc" };
    const [productsResponse, categories] = await Promise.all([getProducts(queryWithSort), getCategories()]);

    // SSR에서는 loading: false로 항상 설정 (로딩 상태 없음)
    return {
      products: productsResponse.products,
      totalCount: productsResponse.pagination.total,
      categories,
      loading: false, // SSR에서는 항상 false
      error: null,
      status: "done",
    };
  } catch (error) {
    console.error("홈페이지 SSR 데이터 로드 실패:", error);
    // 에러 발생 시에도 로딩 상태는 false
    return {
      products: [],
      totalCount: 0,
      categories: {},
      loading: false, // 에러 시에도 로딩 상태 없음
      error: error.message,
      status: "done",
    };
  }
};

HomePageComponent.metadata = () => ({
  title: "쇼핑몰 - 상품 목록",
  description: "다양한 상품을 만나보세요",
});

export const HomePage = HomePageComponent;
