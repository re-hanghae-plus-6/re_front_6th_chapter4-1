import { isClient } from "../constants";
import { productStore, cartStore, PRODUCT_ACTIONS, CART_ACTIONS } from "../stores";

/**
 * SSR에서 전달된 초기 데이터를 스토어에 복원
 */
export function hydrateStoreFromSSR() {
  if (isClient || !window.__INITIAL_DATA__) {
    return false;
  }

  const data = window.__INITIAL_DATA__;

  try {
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

    if (data.cartItems) {
      cartStore.dispatch({
        type: CART_ACTIONS.LOAD_FROM_STORAGE,
        payload: {
          items: data.cartItems,
          selectedAll: data.cartSelectedAll ?? false,
        },
      });
    }

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

/**
 * 카테고리 데이터가 있는지 확인
 */
export function hasCategoryData() {
  const state = productStore.getState();
  return state.categories && Object.keys(state.categories).length > 0;
}
