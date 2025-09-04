import { App } from "./App";
import { router } from "./router";
import { BASE_URL } from "./constants.ts";
import { hydrateRoot } from "react-dom/client";
import { hydrateProduct } from "./entities/index.ts";

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
  // createRoot(rootElement).render(<App />);
  hydrateRoot(rootElement, <App />); // 뭐가 다른지 알아보자
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
