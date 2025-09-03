import { registerGlobalEvents } from "./utils";
import { initRender } from "./render";
import { registerAllEvents } from "./events";
import { loadCartFromStorage } from "./services";
import { router } from "./router";
import { BASE_URL } from "./constants.js";
import { productStore } from "./stores";
import { PRODUCT_ACTIONS } from "./stores/actionTypes";

const enableMocking = () =>
  import("./mocks/browser.js").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

// SSR 데이터를 클라이언트 스토어에 hydrate
function hydrateFromSSRData() {
  if (typeof window === "undefined" || !window.__INITIAL_DATA__) {
    return;
  }

  try {
    const initialData = window.__INITIAL_DATA__;

    const currentPath = window.location.pathname;

    // 홈페이지 hydration
    if (currentPath === "/" && initialData.products) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: initialData.products || [],
          totalCount: initialData.totalCount || 0,
          categories: initialData.categories || {},
          currentProduct: null,
          relatedProducts: [],
          loading: false,
          error: null,
          status: "done",
        },
      });
    }
    // 상품 상세 페이지 hydration
    else if (currentPath.includes("/product/") && initialData.product) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: [],
          totalCount: 0,
          categories: {},
          currentProduct: initialData.product,
          relatedProducts: initialData.relatedProducts || [],
          loading: false,
          error: null,
          status: "done",
        },
      });
    }

    // hydration 완료 플래그
    window.__HYDRATED__ = true;
  } catch (error) {
    console.error("💥 SSR 데이터 hydration 실패:", error);
  }
}

function main() {
  registerAllEvents();
  registerGlobalEvents();
  loadCartFromStorage();

  // Hydration을 가장 먼저 실행
  hydrateFromSSRData();

  initRender();
  router.start();
}

if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
