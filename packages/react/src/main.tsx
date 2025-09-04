import { App } from "./App";
import { router } from "./router";
import { BASE_URL } from "./constants.ts";
import { createRoot, hydrateRoot } from "react-dom/client";
import { ProductProvider } from "./entities/index.ts";

const enableMocking = async () => {
  // 브라우저 환경에서만 MSW 실행
  if (typeof window === "undefined") {
    return Promise.resolve();
  }

  const { worker } = await import("./mocks/browser");
  return await worker.start({
    serviceWorker: {
      url: `${BASE_URL}mockServiceWorker.js`,
    },
    onUnhandledRequest: "bypass",
  });
};

function main() {
  router.start();

  const rootElement = document.getElementById("root")!;
  if (typeof window !== "undefined") {
    const initData = window?.__INITIAL_DATA__;

    hydrateRoot(
      rootElement,
      <ProductProvider initialData={initData}>
        <App />
      </ProductProvider>,
    );
  } else {
    createRoot(rootElement).render(<App />);
  }
}

// 애플리케이션 시작
if (typeof window !== "undefined") {
  if (import.meta.env.MODE !== "test") {
    enableMocking().then(main);
  } else {
    main();
  }
}
