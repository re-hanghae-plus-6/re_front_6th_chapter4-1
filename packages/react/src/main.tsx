import { App } from "./App";
import { router } from "./router";
import { BASE_URL } from "./constants.ts";
import { createRoot, hydrateRoot } from "react-dom/client";
import { hydrateFromServerData, completeHydration } from "./hydration";

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

  const rootElement = document.getElementById("root")!;

  // SSR 데이터가 있는 경우 hydration, 없는 경우 일반 렌더링
  if (window.__INITIAL_DATA__) {
    console.log("Client: Hydrating with server data");

    // 서버 데이터로 hydration
    hydrateFromServerData();

    // React hydration
    hydrateRoot(rootElement, <App />);

    // hydration 완료 알림
    completeHydration();

    console.log("Client: Hydration completed");
  } else {
    console.log("Client: Rendering without server data");

    // 일반 클라이언트 렌더링
    createRoot(rootElement).render(<App />);
  }
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
