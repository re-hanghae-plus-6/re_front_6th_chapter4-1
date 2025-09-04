import { ProductList, SearchBar } from "../components";
import { PRODUCT_ACTIONS, productStore } from "../stores";
import { router, withLifecycle } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";
import { PageWrapper } from "./PageWrapper.js";
import { loadInitialData } from "../utils/loadInitialData.js";
import { hydrateStores } from "../utils/hydrateStores.js";

export const HomePage = withLifecycle(
  {
    onMount: async () => {
      if (typeof window === "undefined") return; // SSR 방어

      const state = productStore.getState();

      // ✅ 이미 SSR 하이드레이션 된 경우 → 패스
      if (state.products && state.products.length > 0) return;

      // ✅ 초기화 (CSR로 들어오는 경우 대비)
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: [],
          categories: [],
          totalCount: 0,
          loading: true,
          status: "idle",
          error: null,
        },
      });

      // ✅ SSG JSON 먼저
      const staticData = await loadInitialData("/");
      if (staticData) {
        hydrateStores(staticData);
        return;
      }

      // ✅ 없으면 API fallback
      loadProductsAndCategories();
    },
    watches: [
      [
        () => {
          const { search, limit, sort, category1, category2 } = router.query;
          return [search, limit, sort, category1, category2];
        },
        () => {
          loadProducts(true);
        },
      ],
    ],
  },
  ({ initialData } = {}) => {
    // SSR - initialData, CSR - store
    const productState = typeof window === "undefined" ? initialData : productStore.getState();

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
