import { PRODUCT_ACTIONS, productStore } from "../entities";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const hydrateStores = (data: any) => {
  // SSR 진입 시 항상 초기화
  productStore.dispatch({ type: PRODUCT_ACTIONS.RESET_FILTERS });

  if (data.products) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        products: data.products,
        categories: data.categories,
        totalCount: data.totalCount,
        loading: false,
        status: "done",
        error: null,
      },
    });
  }

  if (data.currentProduct) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
      payload: data.currentProduct,
    });

    if (data.relatedProducts) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
        payload: data.relatedProducts,
      });
    }
  }
};
