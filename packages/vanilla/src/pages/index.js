import { ProductList, SearchBar } from "../components/index.js";
import { productStore } from "../stores/index.js";
import { router, withLifecycle } from "../router/index.js";
import { loadProducts, loadProductsAndCategories } from "../services/index.js";
import { PageWrapper } from "./PageWrapper.js";
import { hasHomePageData } from "../utils/index.js";

import { getProducts, getCategories } from "../api/productApi.js";

// 실제 렌더링 로직 - 서버와 클라이언트에서 공통 사용
const renderHomePage = (productState, query) => {
  const { search: searchQuery, limit, sort, category1, category2 } = query;
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
};

// 서버 전용 렌더 함수
export const renderHomePageForServer = (initialData) => {
  const productState = {
    products: initialData.products,
    loading: initialData.loading,
    error: initialData.error,
    totalCount: initialData.totalCount,
    categories: initialData.categories,
  };

  return renderHomePage(productState, initialData.query);
};

// 클라이언트용 컴포넌트 (기존과 동일한 구조)
export const HomePage = withLifecycle(
  {
    onMount: () => {
      // SSR 데이터가 이미 있다면 로딩하지 않음
      if (!hasHomePageData()) {
        loadProductsAndCategories();
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
    const query = router.query;
    return renderHomePage(productState, query);
  },
);

export const getServerSideProps = async (context) => {
  const query = context.query || {};
  const page = Number(query.current ?? query.page ?? 1);
  const limit = Number(query.limit ?? 20);
  const sort = query.sort || "price_asc";
  const normalizedQuery = { ...query, current: String(page), limit: String(limit), sort };

  try {
    const [productsResponse, categories] = await Promise.all([getProducts(query), getCategories()]);

    return {
      initialData: {
        products: productsResponse.products,
        categories,
        totalCount: productsResponse.pagination.total,
        loading: false,
        error: null,
        status: "done",
        query: normalizedQuery,
      },
    };
  } catch (error) {
    console.log(error);
    return {
      initialData: {
        products: [],
        categories: [],
        totalCount: 0,
        loading: false,
        error: error.message,
        status: "error",
        query: normalizedQuery,
      },
    };
  }
};
