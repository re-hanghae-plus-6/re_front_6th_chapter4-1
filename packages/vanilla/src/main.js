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

// 서버 데이터 복원 (Hydration)
function restoreServerData() {
  if (window.__INITIAL_DATA__) {
    console.log("🔄 서버 데이터 복원 중:", window.__INITIAL_DATA__);
    const data = window.__INITIAL_DATA__;

    if (data.products && data.products.length > 0) {
      // 홈페이지 데이터 복원
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: data.products,
          totalCount: data.totalCount,
          categories: data.categories,
          loading: false,
          status: "done",
        },
      });
    }

    if (data.currentProduct) {
      // 상품 상세 페이지 데이터 복원
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

    delete window.__INITIAL_DATA__;
    console.log("✅ 서버 데이터 복원 완료");
  }
}

function main() {
  // 서버 데이터 복원을 먼저 실행
  restoreServerData();

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
