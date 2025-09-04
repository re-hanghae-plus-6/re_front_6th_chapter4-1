import { registerGlobalEvents } from "./utils";
import { initRender } from "./render";
import { registerAllEvents } from "./events";
import { loadCartFromStorage } from "./services";
import { router } from "./router";
import { BASE_URL } from "./constants.js";
import { productStore } from "./stores/productStore.js";
import { PRODUCT_ACTIONS } from "./stores/actionTypes.js";

const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

function hydrateWithServerData() {
  // 서버에서 전달받은 초기 데이터가 있는지 확인
  if (typeof window !== "undefined" && window.__INITIAL_DATA__) {
    const initialData = window.__INITIAL_DATA__;

    if (initialData.products && initialData.categories) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: initialData.products,
          categories: initialData.categories,
          totalCount: initialData.totalCount,
          loading: false,
          status: "done",
          error: null,
        },
      });
    } else if (initialData.currentProduct) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
        payload: initialData.currentProduct,
      });

      if (initialData.relatedProducts) {
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
          payload: initialData.relatedProducts,
        });
      }
    }

    // 초기 데이터 사용 후 제거
    delete window.__INITIAL_DATA__;
  } else {
    console.log("❌ 서버 데이터 없음");
  }
}

function main() {
  // 서버 데이터로 스토어 하이드레이션
  hydrateWithServerData();
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
