import { registerGlobalEvents } from "./utils";
import { initRender } from "./render";
import { registerAllEvents } from "./events";
import { loadCartFromStorage } from "./services";
import { router } from "./router";
import { BASE_URL } from "./constants.js";
import { productStore } from "./stores";

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
  // SSR 데이터가 있으면 store에 설정
  if (window.__INITIAL_DATA__) {
    const { currentProduct, relatedProducts, error } = window.__INITIAL_DATA__;
    if (currentProduct) {
      productStore.setState({
        currentProduct,
        relatedProducts: relatedProducts || [],
        loading: false,
        error: null,
      });
    } else if (error) {
      productStore.setState({
        currentProduct: null,
        relatedProducts: [],
        loading: false,
        error,
      });
    }
  }

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
