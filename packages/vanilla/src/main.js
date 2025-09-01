import { registerGlobalEvents } from "./utils";
import { initRender } from "./render";
import { registerAllEvents } from "./events";
import { loadCartFromStorage } from "./services";
import { router } from "./router";
import { BASE_URL } from "./constants.js";

if (typeof window !== "undefined" && window.__INITIAL_DATA__) {
  const data = window.__INITIAL_DATA__;
  console.log("Hydrating with server data:", data);

  // productStore에 서버 데이터 복원
  if (data.products) {
    // 실제 Store 구현에 맞게 수정 필요
    // productStore.dispatch({ type: 'SETUP', payload: data.products });
  }

  // 초기 데이터 정리
  delete window.__INITIAL_DATA__;
}

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
  loadCartFromStorage();
  initRender();
  router.start();
}

if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
