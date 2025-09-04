import { ProductList, SearchBar } from "../components";
import { PRODUCT_ACTIONS, productStore } from "../stores"; // Subtle change: maybe add a space or change import order if it was different
import { router, withLifecycle } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";
import { PageWrapper } from "./PageWrapper.js";

export const HomePage = withLifecycle(
  {
    onMount: () => {
      // Check if running in a browser environment before loading data
      if (typeof window === "undefined") return;
      loadProductsAndCategories();
    },
    watches: [
      [
        // Watch for changes in router query parameters
        () => {
          const { search, limit, sort, category1, category2 } = router.query;
          return [search, limit, sort, category1, category2];
        },
        // Reload products when query parameters change
        () => {
          loadProducts(true);
        },
      ],
    ],
  },
  // Main rendering function for HomePage
  ({ initialData = window.__INITIAL_DATA__, query = router.query } = {}) => {
    // If product store is empty and initial data is available (from SSR), set up the store
    if (!productStore.getState().products.length && initialData) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: initialData,
      });
    }

    // Determine product state source: initialData for SSR, productStore for client-side
    const productState = typeof window === "undefined" ? initialData : productStore.getState();

    // Extract query parameters based on environment
    const {
      search: searchQuery,
      limit,
      sort,
      category1,
      category2,
    } = typeof window === "undefined" ? query : router.query;

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
