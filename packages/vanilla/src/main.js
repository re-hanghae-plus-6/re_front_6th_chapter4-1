import { registerGlobalEvents } from "./utils";
import { initRender } from "./render";
import { registerAllEvents } from "./events";
import { loadCartFromStorage } from "./services";
import { productStore } from "./stores";
import { initialProductState } from "./stores/productStore";
import { PRODUCT_ACTIONS } from "./stores/actionTypes";
import { router } from "./router";
import { BASE_URL } from "./constants.js";

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

  // Hydrate store with SSR data if present
  if (typeof window !== "undefined" && window.__INITIAL_DATA__) {
    try {
      const data = window.__INITIAL_DATA__;
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: { ...initialProductState, ...data, loading: false, status: "done" },
      });
    } finally {
      delete window.__INITIAL_DATA__;
    }
  }

  initRender();

  router.start();

  loadCartFromStorage();
}

if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
