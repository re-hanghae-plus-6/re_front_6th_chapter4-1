import { ProductList, SearchBar } from "../components";
import { productStore } from "../stores";
import { router, withLifecycle } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";
import { PageWrapper } from "./PageWrapper.js";

const HomePageComponent = withLifecycle(
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

// SSR 메서드 추가
HomePageComponent.ssr = async ({ query }) => {
  const { getProducts, getCategories } = await import("../api/productApi.js");
  const { createStore } = await import("../lib/createStore.js");
  const { PRODUCT_ACTIONS } = await import("../stores/actionTypes.js");

  const productStore = createStore(
    (state, action) => {
      switch (action.type) {
        case PRODUCT_ACTIONS.SET_STATUS:
          return { ...state, status: action.payload };
        case PRODUCT_ACTIONS.SET_CATEGORIES:
          return { ...state, categories: action.payload, loading: false, error: null, status: "done" };
        case PRODUCT_ACTIONS.SET_PRODUCTS:
          return {
            ...state,
            products: action.payload.products,
            totalCount: action.payload.totalCount,
            loading: false,
            error: null,
            status: "done",
          };
        case PRODUCT_ACTIONS.SETUP:
          return { ...state, ...action.payload };
        default:
          return state;
      }
    },
    {
      products: [],
      totalCount: 0,
      loading: true,
      error: null,
      status: "idle",
      categories: {},
    },
  );

  try {
    // SSR에서도 클라이언트와 동일한 정렬 기준 사용
    const queryWithSort = { ...query, sort: query.sort || "price_asc" };
    const [productsResponse, categories] = await Promise.all([getProducts(queryWithSort), getCategories()]);

    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        products: productsResponse.products,
        totalCount: productsResponse.pagination.total,
        categories,
        loading: false,
        status: "done",
      },
    });

    return productStore.getState();
  } catch (error) {
    console.error("홈페이지 SSR 데이터 로드 실패:", error);
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        loading: false,
        error: error.message,
        status: "done",
      },
    });
    return productStore.getState();
  }
};

HomePageComponent.metadata = () => ({
  title: "쇼핑몰 - 상품 목록",
  description: "다양한 상품을 만나보세요",
});

export const HomePage = HomePageComponent;
