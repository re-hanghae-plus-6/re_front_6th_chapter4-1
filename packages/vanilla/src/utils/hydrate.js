import { PRODUCT_ACTIONS } from "../stores/actionTypes";
import { productStore } from "../stores";

export function hydrate() {
  const initialData = window.__INITIAL_DATA__;
  if (!initialData) return;

  // 홈페이지 데이터가 있는 경우
  if (initialData.products) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        products: initialData.products,
        categories: initialData.categories || {},
        totalCount: initialData.totalCount || 0,
        loading: false,
        status: "done",
        error: null,
      },
    });
  }

  // 상품 상세 페이지 데이터가 있는 경우
  if (initialData.product) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
      payload: initialData.product,
    });

    // 관련 상품 데이터도 설정
    if (initialData.relatedProducts) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
        payload: initialData.relatedProducts,
      });
    }
  }

  delete window.__INITIAL_DATA__;
}
