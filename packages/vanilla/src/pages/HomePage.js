import { ProductList, SearchBar } from "../components";
import { productStore } from "../stores";
import { router, withLifecycle } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";
import { PageWrapper } from "./PageWrapper.js";

export const HomePage = withLifecycle(
  {
    onMount: async () => {
      if (typeof window === "undefined") return;
      const state = productStore.getState();

      // 이미 스토어에 데이터 있으면 아무 것도 안함 (SSR 하이드레이션 된 경우)
      if (state.products && state.products.length > 0) return;

      try {
        // index.json 우선 시도
        const res = await fetch("/index.json");
        if (res.ok) {
          const data = await res.json();
          productStore.setState({
            products: data.products,
            categories: data.categories,
            totalCount: data.totalCount,
            loading: false,
            error: null,
          });
          return;
        }
      } catch (e) {
        console.warn("index.json 로드 실패 → API fallback 실행");
        console.error(e);
      }

      // fallback: CSR API 호출
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
