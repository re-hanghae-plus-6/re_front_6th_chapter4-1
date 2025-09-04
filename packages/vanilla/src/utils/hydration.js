import { productStore, PRODUCT_ACTIONS } from "../stores";

/**
 * SSR에서 전달된 초기 데이터를 스토어에 복원
 */
export function hydrateStoreFromSSR() {
  if (typeof window === "undefined" || !window.__INITIAL_DATA__) {
    return false;
  }

  const data = window.__INITIAL_DATA__;
  console.log("Restoring initial data:", data);

  try {
    // 홈페이지 데이터 복원
    if (data.products || data.categories || typeof data.totalCount !== "undefined") {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: data.products ?? [],
          categories: data.categories ?? {},
          totalCount: data.totalCount ?? 0,
          loading: false,
          error: null,
          status: "done",
        },
      });
    }

    // 상품 상세 페이지 데이터 복원
    if (data.currentProduct) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
        payload: data.currentProduct,
      });
    }

    if (data.relatedProducts) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
        payload: data.relatedProducts,
      });
    }

    // 메모리 정리
    cleanupInitialData();
    return true;
  } catch (error) {
    console.error("Failed to hydrate store from SSR data:", error);
    cleanupInitialData();
    return false;
  }
}

/**
 * window.__INITIAL_DATA__ 정리
 */
function cleanupInitialData() {
  try {
    delete window.__INITIAL_DATA__;
  } catch {
    window.__INITIAL_DATA__ = undefined;
  }
}

/**
 * 스토어에 이미 데이터가 있는지 확인
 */
export function hasStoreData() {
  const state = productStore.getState();
  return state.status !== "idle" && (state.products.length > 0 || state.currentProduct);
}

/**
 * 홈페이지용 데이터가 있는지 확인
 */
export function hasHomePageData() {
  const state = productStore.getState();
  return state.status !== "idle" && state.products.length > 0;
}

/**
 * 상품 상세 페이지용 데이터가 있는지 확인
 */
export function hasProductDetailData(productId) {
  const state = productStore.getState();
  return state.currentProduct && state.currentProduct.productId === productId;
}
