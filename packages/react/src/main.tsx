import { App } from "./App";
import { router } from "./router";
import { BASE_URL } from "./constants.ts";
import { createRoot, hydrateRoot } from "react-dom/client";
import { hasInitialData } from "./utils/hydration";

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
  const rootElement = document.getElementById("root")!;

  const hasSSRData = hasInitialData();
  const hasServerContent = rootElement.innerHTML.trim() !== "";

  router.start();

  if (hasSSRData || hasServerContent) {
    hydrateRoot(rootElement, <App />);
  } else {
    createRoot(rootElement).render(<App />);
  }
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
