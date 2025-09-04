import { registerGlobalEvents, hydrateStoreFromSSR } from "./utils/index.js";
import { initRender } from "./render.js";
import { registerAllEvents } from "./events.js";
import { loadCartFromStorage } from "./services/index.js";
import { router } from "./router/index.js";
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

function main() {
  registerAllEvents();
  registerGlobalEvents();
  loadCartFromStorage();

  // SSR 초기 데이터 복원
  hydrateStoreFromSSR();

  initRender();
  router.start();
}

if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
