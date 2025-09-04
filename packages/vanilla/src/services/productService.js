import { getCategories, getProduct, getProducts } from "../api/productApi";
import { routerInstance } from "../router";
import { initialProductState, PRODUCT_ACTIONS, productStore } from "../stores";

export const loadProductsAndCategories = async (query = {}, store = productStore) => {
  // SSR에서는 전달받은 query 사용, CSR에서는 router query 사용
  const routerQuery = store === productStore ? routerInstance.query : {};
  const queryParams =
    Object.keys(query).length > 0 ? { ...query, current: undefined } : { ...routerQuery, current: undefined };

  if (store === productStore) {
    routerInstance.query = queryParams;
  }

  store.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: {
      ...initialProductState,
      loading: true,
      status: "pending",
    },
  });

  try {
    const [
      {
        products,
        pagination: { total },
      },
      categories,
    ] = await Promise.all([getProducts(queryParams), getCategories()]);

    // 페이지 리셋이면 새로 설정, 아니면 기존에 추가
    store.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        products,
        categories,
        totalCount: total,
        loading: false,
        status: "done",
      },
    });
  } catch (error) {
    store.dispatch({
      type: PRODUCT_ACTIONS.SET_ERROR,
      payload: error.message,
    });
    throw error;
  }
};

/**
 * 상품 목록 로드 (새로고침)
 */
export const loadProducts = async (resetList = true) => {
  try {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: { loading: true, status: "pending", error: null },
    });

    const {
      products,
      pagination: { total },
    } = await getProducts(routerInstance.query);
    const payload = { products, totalCount: total };

    // 페이지 리셋이면 새로 설정, 아니면 기존에 추가
    if (resetList) {
      productStore.dispatch({ type: PRODUCT_ACTIONS.SET_PRODUCTS, payload });
      return;
    }
    productStore.dispatch({ type: PRODUCT_ACTIONS.ADD_PRODUCTS, payload });
  } catch (error) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_ERROR,
      payload: error.message,
    });
    throw error;
  }
};

/**
 * 다음 페이지 로드 (무한 스크롤)
 */
export const loadMoreProducts = async () => {
  const state = productStore.getState();
  const hasMore = state.products.length < state.totalCount;

  if (!hasMore || state.loading) {
    return;
  }

  routerInstance.query = { current: Number(routerInstance.query.current ?? 1) + 1 };
  await loadProducts(false);
};
/**
 * 상품 검색
 */
export const searchProducts = (search) => {
  routerInstance.query = { search, current: 1 };
};

/**
 * 카테고리 필터 설정
 */
export const setCategory = (categoryData) => {
  routerInstance.query = { ...categoryData, current: 1 };
};

/**
 * 정렬 옵션 변경
 */
export const setSort = (sort) => {
  routerInstance.query = { sort, current: 1 };
};

/**
 * 페이지당 상품 수 변경
 */
export const setLimit = (limit) => {
  routerInstance.query = { limit, current: 1 };
};

/**
 * 상품 상세 페이지용 상품 조회 및 관련 상품 로드
 */
export const loadProductDetailForPage = async (productId, store = productStore) => {
  try {
    const currentProduct = store.getState().currentProduct;
    if (productId === currentProduct?.productId) {
      // 관련 상품 로드 (같은 category2 기준)
      if (currentProduct.category2) {
        await loadRelatedProducts(currentProduct.category2, productId, store);
      }
      return;
    }
    // 현재 상품 클리어
    store.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        ...initialProductState,
        currentProduct: null,
        loading: true,
        status: "pending",
      },
    });

    const product = await getProduct(productId);

    // 현재 상품 설정
    store.dispatch({
      type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
      payload: product,
    });

    // 관련 상품 로드 (같은 category2 기준)
    if (product.category2) {
      await loadRelatedProducts(product.category2, productId, store);
    }
  } catch (error) {
    console.error("상품 상세 페이지 로드 실패:", error);
    store.dispatch({
      type: PRODUCT_ACTIONS.SET_ERROR,
      payload: error.message,
    });
    throw error;
  }
};

/**
 * 관련 상품 로드 (같은 카테고리의 다른 상품들)
 */
export const loadRelatedProducts = async (category2, excludeProductId, store = productStore) => {
  try {
    const params = {
      category2,
      limit: 20, // 관련 상품 20개
      page: 1,
    };

    const response = await getProducts(params);

    // 현재 상품 제외
    const relatedProducts = response.products.filter((product) => product.productId !== excludeProductId);

    store.dispatch({
      type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
      payload: relatedProducts,
    });
  } catch (error) {
    console.error("관련 상품 로드 실패:", error);
    // 관련 상품 로드 실패는 전체 페이지에 영향주지 않도록 조용히 처리
    store.dispatch({
      type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
      payload: [],
    });
  }
};
