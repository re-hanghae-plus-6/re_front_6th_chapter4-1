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
 * 서버에서 전달받은 초기 데이터로 클라이언트 상태 복원
 */
function hydrateFromServerData() {
  if (window.__INITIAL_DATA__) {
    const data = window.__INITIAL_DATA__;

    // 상품 스토어 상태 복원 - SSR 데이터가 있으면 즉시 복원
    if (data.products || data.categories || data.currentProduct || data.relatedProducts) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          ...data,
          loading: false, // SSR 데이터가 있으면 로딩 상태 없음
          error: null,
          status: "done",
        },
      });

      console.log("클라이언트 하이드레이션 완료 - SSR 데이터로 상태 복원:", {
        productsCount: data.products?.length || 0,
        categoriesCount: Object.keys(data.categories || {}).length,
        loading: false,
      });
    }

    // 초기 데이터 정리
    delete window.__INITIAL_DATA__;
  }
}

function main() {
  // 1. 서버 데이터로 상태 복원 (하이드레이션)
  hydrateFromServerData();

  // 2. 이벤트 등록
  registerAllEvents();
  registerGlobalEvents();

  // 3. 장바구니 로드
  loadCartFromStorage();

  // 4. 렌더링 초기화
  initRender();

  // 5. 라우터 시작
  router.start();
}

if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
