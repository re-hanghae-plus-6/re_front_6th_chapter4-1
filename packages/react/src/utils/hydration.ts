import { productStore, PRODUCT_ACTIONS } from "../entities/products/productStore";
import { cartStore, CART_ACTIONS } from "../entities/carts/cartStore";

interface InitialData {
  products?: unknown[];
  totalCount?: number;
  categories?: unknown[];
  product?: unknown;
  relatedProducts?: unknown[];
}

/**
 * 서버에서 전달받은 initialData로 스토어를 초기화하는 함수
 */
export const hydrateStores = (initialData: InitialData) => {
  if (!initialData) return;

  // 상품 데이터 초기화
  if (initialData.products) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_PRODUCTS,
      payload: { products: initialData.products, totalCount: initialData.totalCount },
    });
  }

  if (initialData.categories) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_CATEGORIES,
      payload: initialData.categories,
    });
  }

  if (initialData.product) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
      payload: initialData.product,
    });
  }

  if (initialData.relatedProducts) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
      payload: initialData.relatedProducts,
    });
  }

  // 장바구니 데이터 초기화 (서버에서는 빈 상태)
  cartStore.dispatch({
    type: CART_ACTIONS.LOAD_FROM_STORAGE,
    payload: { items: [], selectedAll: false },
  });
};

/**
 * window.INITIAL_DATA가 있는지 확인하고 스토어를 초기화
 */
declare global {
  interface Window {
    __INITIAL_DATA__?: InitialData;
  }
}

export const initializeStoresFromSSR = () => {
  const initialData = window.__INITIAL_DATA__;
  if (initialData) {
    hydrateStores(initialData);
    // 초기화 후 window에서 제거
    delete window.__INITIAL_DATA__;
  }
};
