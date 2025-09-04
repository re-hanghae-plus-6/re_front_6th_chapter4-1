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

async function restoreSSRState() {
  if (typeof window !== "undefined" && window.__INITIAL_DATA__) {
    const initialState = window.__INITIAL_DATA__;

    // 상품 스토어 상태 복원
    const { productStore } = await import("./stores/index.js");
    if (productStore && initialState) {
      productStore.setState(initialState);
    }

    // 초기 데이터 삭제
    delete window.__INITIAL_DATA__;
    return true;
  }
  return false;
}

async function main() {
  registerAllEvents();
  registerGlobalEvents();

  const hasSSRState = await restoreSSRState();

  // SSR 상태가 없는 경우에만 로컬 스토리지에서 카트 데이터 로드
  if (!hasSSRState) {
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
