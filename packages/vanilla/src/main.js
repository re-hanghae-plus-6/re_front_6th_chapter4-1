import { registerGlobalEvents } from "./utils";
import { initRender } from "./render";
import { registerAllEvents } from "./events";
import { loadCartFromStorage } from "./services";
import { router } from "./router";
import { BASE_URL } from "./constants.js";
import { productStore, PRODUCT_ACTIONS } from "./stores";

const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

/**
 * __INITIAL_DATA__ 하이드레이션
 */
function hydrateFromInitialData() {
  if (typeof window !== "undefined" && window.__INITIAL_DATA__) {
    try {
      const initialData = window.__INITIAL_DATA__;
      console.log("Hydrating from initial data:", initialData);

      if (initialData.products && initialData.categories) {
        productStore.dispatch(PRODUCT_ACTIONS.SETUP, {
          products: initialData.products,
          totalCount: initialData.pagination?.total || initialData.products.length,
          categories: initialData.categories,
          loading: false,
          error: null,
          status: "done",
        });
        console.log("Home page data hydrated");
      }

      if (initialData.currentProduct) {
        productStore.dispatch(PRODUCT_ACTIONS.SET_CURRENT_PRODUCT, initialData.currentProduct);
        console.log("Product detail data hydrated");
      }

      delete window.__INITIAL_DATA__;
    } catch (error) {
      console.error("Failed to hydrate from initial data:", error);
      if (window.__INITIAL_DATA__) {
        delete window.__INITIAL_DATA__;
      }
    }
  }
}

function main() {
  hydrateFromInitialData();

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
