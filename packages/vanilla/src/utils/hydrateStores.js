import { PRODUCT_ACTIONS, productStore } from "../stores";

export const hydrateStores = (data) => {
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
