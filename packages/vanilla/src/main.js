import { BASE_URL } from "./constants.js";
import { registerAllEvents } from "./events";
import { initRender } from "./render";
import { router } from "./router";
import { loadCartFromStorage } from "./services";
import { initializeFromSSR } from "./stores";
import { getRegisteredEvents, registerGlobalEvents } from "./utils";

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
  // SSR 초기 데이터가 있으면 상태 초기화
  if (window.__INITIAL_DATA__) {
    console.log("🔄 SSR 초기 데이터로 상태 초기화:", window.__INITIAL_DATA__);
    initializeFromSSR(window.__INITIAL_DATA__);
  }

  // 이벤트 등록 순서 중요: 먼저 이벤트 핸들러들을 등록하고, 그 다음에 전역 이벤트 리스너를 등록
  registerAllEvents();
  registerGlobalEvents();

  // 이벤트 등록 상태 확인 (디버깅용)
  console.log("📋 등록된 이벤트 핸들러:", getRegisteredEvents());

  loadCartFromStorage();
  initRender();
  router.start();
}

if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
