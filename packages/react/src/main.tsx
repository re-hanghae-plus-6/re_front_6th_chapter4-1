import { hydrateRoot } from "react-dom/client";
import { App } from "./App";
import { BASE_URL } from "./constants.ts";
import { router } from "./router";
import { PRODUCT_ACTIONS, productStore } from "./entities"; // 추가

const enableMocking = () =>
  import("./mocks/browser").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

// SSR 데이터 동기 하이드레이션 (hydrateRoot 전에 호출)
// ...생략

function hydrateFromSSRDataSync() {
  if (typeof window === "undefined" || !window.__INITIAL_DATA__ || window.__HYDRATED__) return;

  const d = window.__INITIAL_DATA__;
  const path = window.location.pathname;

  // 홈 페이지
  if (path === "/") {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: d.error
        ? {
            products: [],
            totalCount: 0,
            categories: {},
            currentProduct: null,
            relatedProducts: [],
            loading: false,
            error: d.error,
            status: "error",
          }
        : {
            products: d.products || [],
            totalCount: d.totalCount || 0,
            categories: d.categories || {},
            currentProduct: null,
            relatedProducts: [],
            loading: false,
            error: null,
            status: "done",
          },
    });
  }
  // 상품 상세 페이지
  else if (path.includes("/product/")) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: d.error
        ? {
            products: [],
            totalCount: 0,
            categories: {},
            currentProduct: null,
            relatedProducts: [],
            loading: false,
            error: d.error,
            status: "error",
          }
        : {
            products: [],
            totalCount: 0,
            categories: {},
            currentProduct: d.product ?? null,
            relatedProducts: d.relatedProducts || [],
            loading: false,
            error: null,
            status: "done",
          },
    });
  }

  window.__HYDRATED__ = true;
}

function main() {
  router.start();

  // 중요: React가 붙기 전에 상태를 맞춰서 DOM이 일치하도록 만듦
  hydrateFromSSRDataSync();

  const rootElement = document.getElementById("root")!;
  hydrateRoot(rootElement, <App />);
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
