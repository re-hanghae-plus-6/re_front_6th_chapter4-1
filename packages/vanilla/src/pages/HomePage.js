import { ProductList, SearchBar } from "../components";
import { productStore } from "../stores";
import { router, withLifecycle } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";
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
  () => {
    const productState = productStore.getState();

    // SSR 환경에서는 global.router 사용, 브라우저에서는 router 모듈 사용
    const currentRouter = typeof window === "undefined" ? global.router : router;
    const {
      search: searchQuery = "",
      limit = "10",
      sort = "recent",
      category1 = "",
      category2 = "",
    } = currentRouter?.query || {};

    const { products = [], loading = false, error = null, totalCount = 0, categories = [] } = productState;
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
