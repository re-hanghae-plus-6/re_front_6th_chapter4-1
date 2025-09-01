import { ProductList, SearchBar } from "../components";
import { productStore } from "../stores";
import { router, withLifecycle } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";
import { PageWrapper } from "./PageWrapper.js";
import { isServer } from "../utils/isServer.js";
import { createMemoryStorage } from "../lib/index.js";

export const HomePage = withLifecycle(
  {
    onMount: () => {
      if (isServer) {
        createMemoryStorage();
      } else loadProductsAndCategories();
    },
    watches: [
      ({ query = router.query } = {}) => {
        const { search, limit, sort, category1, category2 } = query || {};
        return [search, limit, sort, category1, category2];
      },
      () => loadProducts(true),
    ],
  },
  (url, query = router.query, request) => {
    const productState = isServer ? request : productStore.getState();
    const { search: searchQuery, limit, sort, category1, category2 } = isServer ? query || {} : router.query;
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
