import { Router } from "@hanghae-plus/lib";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App";
import { BASE_URL } from "./constants.ts";
import { RouterContext } from "./router/hooks/useRouterContext.ts";
import { routes } from "./router/router.ts";

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
  const router = new Router(routes, BASE_URL);
  router.start();

  const rootElement = document.getElementById("root")!;

  const initData = (window as unknown as { __INITIAL_DATA__: unknown }).__INITIAL_DATA__;

  if (initData) {
    hydrateRoot(
      rootElement,
      <RouterContext value={router}>
        <App data={(window as unknown as { __INITIAL_DATA__: unknown }).__INITIAL_DATA__} />
      </RouterContext>,
    );
  } else {
    createRoot(rootElement).render(
      <RouterContext value={router}>
        <App />
      </RouterContext>,
    );
  }
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
