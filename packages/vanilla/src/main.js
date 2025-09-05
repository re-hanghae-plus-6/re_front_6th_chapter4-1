import { registerGlobalEvents } from "./utils";
import { initRender } from "./render";
import { registerAllEvents } from "./events";
import { loadCartFromStorage } from "./services";
import { router } from "./router";
import { BASE_URL } from "./constants.js";
import { productStore } from "./stores/productStore.js";
import { PRODUCT_ACTIONS } from "./stores/actionTypes.js";

if (typeof window !== "undefined" && window.__INITIAL_DATA__) {
  const data = window.__INITIAL_DATA__;
  console.log("Hydrating with server data:", data);

  // 홈(initial products)용 데이터 복원
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

  // 상품 상세(initial product detail)용 데이터 복원
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
  // 초기 데이터 정리
  delete window.__INITIAL_DATA__;
}

const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

function main() {
  registerAllEvents();
  registerGlobalEvents();
  loadCartFromStorage();
  initRender();

  router.start();
}

if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
