import { ProductList, SearchBar } from "../components";
import { productStore } from "../stores";
import { router, withLifecycle } from "../router";
import { loadProducts, setupProductsAndCategories } from "../services";
import { PageWrapper } from "./PageWrapper.js";
import { withServer } from "../router/withServer.js";
import { getCategories, getProducts } from "../api/productApi.js";

export const HomePage = withServer(
  {
    ssr: async ({ query }) => {
      return await Promise.all([getProducts(query), getCategories()]);
    },
  },
  withLifecycle(
    {
      watches: [
        () => {
          const { search, limit, sort, category1, category2 } = router.query;
          return [search, limit, sort, category1, category2];
        },
        () => loadProducts(true),
      ],
    },
    ({ data } = {}) => {
      setupProductsAndCategories(data);
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
  ),
);
