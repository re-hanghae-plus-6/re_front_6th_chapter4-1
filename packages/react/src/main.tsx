import { createRoot } from "react-dom/client";
import { App } from "./App";
import { BASE_URL } from "./constants.ts";
import { Providers } from "./core/providers.tsx";
import { createProductStore } from "./entities/index.ts";
import * as Home from "./pages/home/page";
import { NotFoundPage } from "./pages/not-found.tsx";
import * as ProductDetail from "./pages/product/detail.page";
import { router } from "./core/router/instance.ts";

const enableMocking = () =>
  import("./mocks/browser").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

router.addRoute("/", Home.PageComponent);
router.addRoute("/product/:id/", ProductDetail.PageComponent);
router.addRoute(".*", NotFoundPage);

function main() {
  router.start();

  const rootElement = document.getElementById("root")!;
  createRoot(rootElement).render(
    <Providers router={router} productStore={createProductStore(window.__INITIAL_DATA__.snapshots.productStore)}>
      <App />
    </Providers>,
  );
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
