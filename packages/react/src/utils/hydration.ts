// SSR 하이드레이션 유틸리티 (vanilla 스타일)

import { productStore, PRODUCT_ACTIONS } from "../entities/products/productStore";
import { cartStore, CART_ACTIONS } from "../entities/carts/cartStore";

declare global {
  interface Window {
    __INITIAL_DATA__?: Record<string, unknown>;
  }
}

/**
 * SSR에서 전달된 초기 데이터를 스토어에 복원
 */
export function hydrateFromSSR(): boolean {
  if (!hasInitialData()) {
    return false;
  }

  const data = window.__INITIAL_DATA__!;

  try {
    // 상품 목록 데이터 복원
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

    // 상품 상세 데이터 복원
    if (data.currentProduct) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
        payload: data.currentProduct,
      });
    }

    // 관련 상품 데이터 복원
    if (data.relatedProducts) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
        payload: data.relatedProducts,
      });
    }

    // 장바구니 데이터 복원
    if (data.cartItems) {
      cartStore.dispatch({
        type: CART_ACTIONS.LOAD_FROM_STORAGE,
        payload: {
          items: data.cartItems,
          selectedAll: data.cartSelectedAll ?? false,
        },
      });
    }

    console.log("[Hydration] SSR data restored to stores:", data);

    cleanupInitialData();
    return true;
  } catch (error) {
    console.error("Failed to hydrate from SSR data:", error);
    cleanupInitialData();
    return false;
  }
}

/**
 * window.__INITIAL_DATA__ 정리
 */
function cleanupInitialData(): void {
  try {
    delete window.__INITIAL_DATA__;
  } catch {
    window.__INITIAL_DATA__ = undefined;
  }
}

/**
 * 초기 데이터 존재 여부 확인
 */
export function hasInitialData(): boolean {
  return (
    typeof window !== "undefined" && !!(window.__INITIAL_DATA__ && Object.keys(window.__INITIAL_DATA__).length > 0)
  );
}

/**
 * 스토어에 이미 데이터가 있는지 확인
 */
export function hasStoreData(): boolean {
  const state = productStore.getState();
  return state.status !== "idle" && (state.products.length > 0 || !!state.currentProduct);
}
