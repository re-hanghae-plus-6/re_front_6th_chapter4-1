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

// 서버에서 전달받은 초기 데이터를 스토어에 설정
function hydrateInitialData() {
  if (typeof window !== "undefined" && window.__INITIAL_DATA__) {
    const initialData = window.__INITIAL_DATA__;

    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        products: initialData.products || [],
        categories: initialData.categories || {},
        totalCount: initialData.totalCount || 0,
        loading: false,
        error: null,
        status: "done",
      },
    });

    // 초기 데이터 사용 후 삭제
    delete window.__INITIAL_DATA__;
  }
}

function main() {
  registerAllEvents();
  registerGlobalEvents();

  // SSR 환경에서는 브라우저 전용 기능들을 건너뛰기
  if (typeof window !== "undefined") {
    // 서버에서 받은 데이터로 하이드레이션
    hydrateInitialData();

    // 장바구니 데이터 로드
    loadCartFromStorage();
  }

  initRender();
  router.start();
}

if (import.meta.env.MODE !== "test") {
  if (typeof window !== "undefined") {
    enableMocking().then(main);
  } else {
    main();
  }
} else {
  main();
}
