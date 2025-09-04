import { getCategories, getProduct, getProducts } from "../api/productApi";
import { initialProductState, productStore, PRODUCT_ACTIONS } from "../stores";
import { router } from "../router";

export const loadProductsAndCategories = async () => {
  router.query = { current: undefined }; // 항상 첫 페이지로 초기화
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: {
      ...initialProductState,
      loading: true,
      status: "pending",
    },
  });

  try {
    const [productsResponse, categories] = await Promise.all([getProducts(router.query), getCategories()]);

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
  } catch (error) {
    console.error("상품 목록 및 카테고리 로드 실패:", error);
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        ...initialProductState,
        error: error.message,
        loading: false,
        status: "done",
      },
    });
  }
};

export const loadProducts = async (reset = false) => {
  const currentState = productStore.getState();
  const currentPage = Math.ceil(currentState.products.length / (router.query.limit || 20));
  const nextPage = reset ? 1 : currentPage + 1;

  if (!reset && currentState.products.length >= currentState.totalCount) {
    console.log("모든 상품을 로드했습니다.");
    return;
  }

  if (!reset) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_STATUS,
      payload: "loading_more",
    });
  }

  try {
    const query = { ...router.query, page: nextPage };
    const response = await getProducts(query);

    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_PRODUCTS,
      payload: {
        products: reset ? response.products : [...currentState.products, ...response.products],
        totalCount: response.pagination.total,
      },
    });
  } catch (error) {
    console.error("상품 목록 로드 실패:", error);
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_STATUS,
      payload: "error",
    });
  }
};

export const searchProducts = async (searchTerm) => {
  router.query = { ...router.query, search: searchTerm, current: undefined };
  await loadProducts(true);
};

export const setCategory = async (categoryData) => {
  router.query = { ...router.query, ...categoryData, current: undefined };
  await loadProducts(true);
};

export const setSort = async (sort) => {
  router.query = { ...router.query, sort, current: undefined };
  await loadProducts(true);
};

export const setLimit = async (limit) => {
  router.query = { ...router.query, limit, current: undefined };
  await loadProducts(true);
};

export const loadMoreProducts = async () => {
  await loadProducts(false);
};

/**
 * 상품 상세 페이지 로드
 */
export const loadProductDetailForPage = async (productId) => {
  console.log("클라이언트에서 상품 상세 페이지 로드 시작:", productId);
  try {
    const currentProduct = productStore.getState().currentProduct;
    if (productId === currentProduct?.productId) {
      console.log("이미 로드된 상품:", productId);
      // 관련 상품 로드 (같은 category2 기준)
      if (currentProduct?.category2) {
        await loadRelatedProducts(currentProduct.category2, productId);
      }
      return;
    }
    // 현재 상품 클리어
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        ...initialProductState,
        currentProduct: null,
        loading: true,
        status: "pending",
      },
    });

    const product = await getProduct(productId);
    console.log("상품 데이터 로드 완료:", product?.title);

    // 현재 상품 설정
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
      payload: product,
    });

    // 관련 상품 로드 (같은 category2 기준)
    if (product && product.category2) {
      await loadRelatedProducts(product.category2, productId);
    }
  } catch (error) {
    console.error("상품 상세 페이지 로드 실패:", error);
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        ...initialProductState,
        error: error.message,
        loading: false,
        status: "done",
      },
    });
  }
};

/**
 * 관련 상품 로드
 */
export const loadRelatedProducts = async (category2, excludeProductId) => {
  try {
    console.log("관련 상품 로드 시작:", category2);
    const response = await getProducts({
      category2,
      limit: 20,
      page: 1,
    });

    const relatedProducts = response.products.filter((product) => product.productId !== excludeProductId);
    console.log("관련 상품 로드 완료:", relatedProducts.length, "개");

    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
      payload: relatedProducts,
    });
  } catch (error) {
    console.error("관련 상품 로드 실패:", error);
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
      payload: [],
    });
  }
};
