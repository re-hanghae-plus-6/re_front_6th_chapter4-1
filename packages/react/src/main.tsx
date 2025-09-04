import { App } from "./App";
import { router } from "./router";
import { BASE_URL } from "./constants.ts";
import { createRoot } from "react-dom/client";
import { PRODUCT_ACTIONS, productStore } from "./entities/index.ts";
import type { Router } from "@hanghae-plus/lib";
import type { FunctionComponent } from "react";

if (typeof window !== "undefined" && window.__INITIAL_DATA__) {
  const data = window.__INITIAL_DATA__;
  console.log("Hydrating with server data:", data);

  // 홈(initial products)용 데이터 복원
  if (data.products) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        products: data.products,
        categories: data.categories,
        totalCount: data.totalCount,
        loading: false,
        status: "done",
        error: null,
      },
    });
  }

  // 상품 상세(initial product detail)용 데이터 복원
  if (data.currentProduct) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
      payload: data.currentProduct,
    });

    if (data.relatedProducts) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
        payload: data.relatedProducts,
      });
    }
  }
  // 초기 데이터 정리
  delete window.__INITIAL_DATA__;
}

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
  (router as Router<FunctionComponent>).start();

  const rootElement = document.getElementById("root")!;
  createRoot(rootElement).render(<App />);
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
