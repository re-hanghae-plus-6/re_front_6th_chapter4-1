import { registerGlobalEvents } from "./utils";
import { initRender } from "./render";
import { registerAllEvents } from "./events";
import { loadCartFromStorage } from "./services";
import { router } from "./router";
import { BASE_URL } from "./constants.js";
import { reconnectEvents } from "./utils/reconnectEvents.js";
import { hydrate } from "./utils/hydrate";

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

  hydrate();

  loadCartFromStorage();
  initRender();

  router.start();

  // 4. 서버 HTML에 이벤트 연결 (SSR에서만, 라우터 시작 후)

  if (document.querySelector("[data-action]")) {
    console.log("✅ data-action 요소 발견, reconnectEvents 실행");
    reconnectEvents();
  } else {
    console.log("❌ data-action 요소 없음");
  }
}

if (import.meta.env.MODE !== "test") {
  enableMocking().finally(main);
} else {
  main();
}
