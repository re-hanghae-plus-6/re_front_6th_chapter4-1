import { App } from "./App";
import { router } from "./router";
import { BASE_URL } from "./constants.ts";
import { createRoot } from "react-dom/client";

const enableMocking = () =>
  import("./mocks/browser")
    .then(({ worker }) => {
      console.log("MSW: Starting worker with BASE_URL:", BASE_URL);
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
  router.start();

  const rootElement = document.getElementById("root")!;
  createRoot(rootElement).render(<App />);
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking()
    .then(() => {
      console.log("Starting main application");
      main();
    })
    .catch((error) => {
      console.error("Failed to initialize application:", error);
      // MSW 실패해도 앱은 시작
      main();
    });
} else {
  main();
}
