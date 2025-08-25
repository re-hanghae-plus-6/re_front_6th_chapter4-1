import { ProductList, SearchBar } from "../components";
import { productStore } from "../stores";
import { router, withLifecycle } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";
import { PageWrapper } from "./PageWrapper.js";

export const HomePage = withLifecycle(
  {
    onMount: () => {
      // 서버에서 하이드레이션된 데이터가 있으면 로딩하지 않음
      const currentState = productStore.getState();
      console.log("🏠 HomePage onMount:", {
        productsLength: currentState.products.length,
        status: currentState.status,
      });

      if (currentState.products.length === 0 || currentState.status !== "done") {
        console.log("📡 새로운 데이터 로드 시작");
        loadProductsAndCategories();
      } else {
        console.log("✅ 서버 데이터 재사용");
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
