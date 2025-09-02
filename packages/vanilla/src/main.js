import { registerGlobalEvents } from "./utils";
import { initRender } from "./render";
import { registerAllEvents } from "./events";
import { loadCartFromStorage } from "./services";
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

function restoreSSRState() {
  if (typeof window !== "undefined" && window.__INITIAL_DATA__) {
    const productState = window.__INITIAL_DATA__;

    import("./stores/index.js").then(({ productStore }) => {
      if (productStore) {
        productStore.setState(productState);
      }
    });

    delete window.__INITIAL_DATA__;
  }
}

function main() {
  registerAllEvents();
  registerGlobalEvents();

  restoreSSRState();

  if (!window.__INITIAL_DATA__?.cartStore) {
    loadCartFromStorage();
  }

  initRender();
  router.start();
}

if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
