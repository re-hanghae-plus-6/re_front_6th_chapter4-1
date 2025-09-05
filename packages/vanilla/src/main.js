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
      onUnhandledRequest: "warn",
    }),
  );

function main() {
  // SSR에서 주입된 초기 데이터 확인 및 hydration
  const initialData = window.__INITIAL_DATA__;
  if (initialData) {
    console.log("Hydrating with initial data:", initialData);

    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        products: initialData.products || [],
        totalCount: initialData.totalCount || 0,
        categories: initialData.categories || {},
        currentProduct: initialData.product || null,
        relatedProducts: initialData.relatedProducts || [],
        loading: false,
        status: "done",
      },
    });
  }

  registerAllEvents();
  registerGlobalEvents();
  loadCartFromStorage();
  initRender();
  router.start();
}

// 현재 node, test, browser환경에서 모두 msw를 사용하므로 분기처리하지 않음.
enableMocking().then(main);

// enableMocking().then(main);
