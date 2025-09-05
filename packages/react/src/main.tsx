import { App } from "./App";
import { router } from "./router";
import { hydrateProductStore } from "./entities/products/productStore";
import { BASE_URL } from "./constants.ts";
import { hydrateRoot, createRoot } from "react-dom/client";

const enableMocking = () =>
  import("./mocks/browser").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

function main() {
  router.start();
  const hasInitialData = hydrateProductStore();

  const rootElement = document.getElementById("root")!;

  if (hasInitialData) {
    hydrateRoot(rootElement, <App />);
  } else {
    createRoot(rootElement).render(<App />);
  }
}

// 애플리케이션 시작
if (import.meta.env.DEV || (typeof window !== "undefined" && !window.__INITIAL_DATA__)) {
  enableMocking().then(main);
} else {
  main();
}
