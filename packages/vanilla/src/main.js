import { registerGlobalEvents } from "./utils";
import { initRender } from "./render";
import { registerAllEvents } from "./events";
import { loadCartFromStorage } from "./services";
import { router } from "./router";
import { BASE_URL } from "./constants.js";
import { PRODUCT_ACTIONS, productStore } from "./stores";

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
    console.log("🔄 하이드레이션 시작:", initialData);

    if (initialData.products && initialData.categories) {
      // 홈페이지 데이터 하이드레이션
      console.log("🏠 홈페이지 데이터 하이드레이션:", initialData.products.length, "개 상품");
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
      // 상품 상세 페이지 데이터 하이드레이션
      console.log("📦 상품 상세 데이터 하이드레이션:", initialData.currentProduct.title);
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
  console.log("main");
  registerAllEvents();
  registerGlobalEvents();
  loadCartFromStorage();

  // 서버 데이터로 스토어 하이드레이션
  hydrateWithServerData();

  initRender();
  router.start();
}

enableMocking().then(main);
