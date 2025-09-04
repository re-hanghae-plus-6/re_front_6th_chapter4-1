import { Router } from "@hanghae-plus/lib";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App";
import { BASE_URL } from "./constants.ts";
import { ProductProvider } from "./entities/products/context/ProductContext.tsx";
import { createProductStore } from "./entities/index.ts";
import { RouterContext } from "./router/hooks/useRouterContext.ts";
import { routes } from "./router/router.ts";
import { hasInitialData } from "./utils/hydration.ts";

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

  const initData = window.__INITIAL_DATA__;

  const renderApp = () => {
    return (
      <RouterContext value={router}>
        <ProductProvider productStore={createProductStore(initData || {})}>
          <App />
        </ProductProvider>
      </RouterContext>
    );
  };

  const rootElement = document.getElementById("root")!;

  const hasSSRData = hasInitialData();
  const hasServerContent = rootElement.innerHTML.trim() !== "";

  if (hasSSRData || hasServerContent) {
    hydrateRoot(rootElement, renderApp());
  } else {
    createRoot(rootElement).render(renderApp());
  }
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
