import { hydrateRoot } from "react-dom/client";

import { App } from "./App";
import { BASE_URL } from "./constants";
import { hydrateProduct } from "./entities";
import { router } from "./router";

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
  hydrateProduct();
  const rootElement = document.getElementById("root")!;
  hydrateRoot(rootElement, <App />);
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
