import { ProductList, SearchBar } from "../components";
import { productStore } from "../stores";
import { router, withLifecycle } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";
import { PageWrapper } from "./PageWrapper.js";

export const HomePage = withLifecycle(
  {
    onMount: () => {
      if (typeof window !== "undefined") {
        loadProductsAndCategories();
      }
    },
    watches: [
      () => {
        if (typeof window !== "undefined") {
          const { search, limit, sort, category1, category2 } = router.query;
          return [search, limit, sort, category1, category2];
        }
        return [];
      },
      () => {
        if (typeof window !== "undefined") {
          loadProducts(true);
        }
      },
    ],
  },
  ({ initialData } = {}) => {
    // SSR - initialData, CSR - store
    const productState =
      typeof window === "undefined"
        ? {
            products: initialData?.products ?? [],
            categories: initialData?.categories ?? [],
            loading: false,
            error: initialData?.error ?? null,
            totalCount: initialData?.totalCount ?? 0,
          }
        : productStore.getState();

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
