import { productStore } from "../stores";
import { router, withLifecycle } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";
import { ProductList, SearchBar } from "../components";
import { PageWrapper } from "./PageWrapper.js";

// 브라우저/스토어/라우터 의존 없는 순수 뷰
export function HomeView({
  products = [],
  loading = false,
  error = null,
  totalCount = 0,
  hasMore = false,
  searchQuery = "",
  limit,
  sort,
  category = { category1: undefined, category2: undefined },
  categories = [],
}) {
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
        ${ProductList({ products, loading, error, totalCount, hasMore })}
      </div>
    `.trim(),
  });
}

export const HomePage = withLifecycle(
  {
    onMount: () => {
      const state = productStore.getState();
      // 초기 로드는 ssr로 채워지기때문에 스킵
      if (state && state.status === "done" && Array.isArray(state.products) && state.products.length > 0) return;
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
    const state = productStore.getState();
    const { search: searchQuery, limit, sort, category1, category2 } = router.query;
    const category = { category1, category2 };
    const hasMore = state.products.length < state.totalCount;

    return HomeView({
      products: state.products,
      loading: state.loading,
      error: state.error,
      totalCount: state.totalCount,
      hasMore,
      searchQuery,
      limit,
      sort,
      category,
      categories: state.categories,
    });
  },
);
