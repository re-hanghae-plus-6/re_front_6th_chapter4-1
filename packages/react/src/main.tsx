import { App } from "./App";
import { router } from "./router";
import { BASE_URL } from "./constants.ts";
import { createRoot, hydrateRoot } from "react-dom/client";
import { getInitialData } from "./utils/ssr";
import { productStore, PRODUCT_ACTIONS } from "./entities/products/productStore";

const enableMocking = () =>
  import("./mocks/browser")
    .then(({ worker }) => {
      return worker.start({
        serviceWorker: {
          url: `${BASE_URL}mockServiceWorker.js`,
        },
        onUnhandledRequest: "bypass",
      });
    })
    .then(() => {
      console.log("MSW: Worker started successfully");
    })
    .catch((error) => {
      console.error("MSW: Failed to start worker:", error);
    });

function main() {
  // SSR 데이터로 스토어 초기화
  const ssrData = getInitialData();

  // SSR 데이터가 있으면 라우터 시작 전에 스토어 초기화
  if (ssrData) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: ssrData,
    });
  }

  router.start();
  const rootElement = document.getElementById("root")!;

  // SSR 데이터가 있으면 hydrateRoot, 없으면 createRoot
  if (ssrData) {
    hydrateRoot(rootElement, <App />);
  } else {
    createRoot(rootElement).render(<App />);
  }
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking()
    .then(() => {
      main();
    })
    .catch((error) => {
      console.error("MSW 초기화 실패:", error);
      // MSW 실패해도 앱은 시작

      main();
    });
} else {
  main();
}
