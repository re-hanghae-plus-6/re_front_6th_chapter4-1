import { App } from "./App";
import { router } from "./router";
import { BASE_URL } from "./constants.ts";
import { createRoot, hydrateRoot } from "react-dom/client";
import { PRODUCT_ACTIONS, productStore } from "./entities/index.ts";
import type { Router } from "@hanghae-plus/lib";
import type { FunctionComponent } from "react";

if (typeof window !== "undefined" && window.__INITIAL_DATA__) {
  const initialData = window.__INITIAL_DATA__;
  console.log("Hydrating with server data:", initialData);

  if (initialData.query) {
    router.query = initialData.query;
  }

  // 홈(initial products)용 데이터 복원
  if (initialData.products) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        products: initialData.products,
        categories: initialData.categories,
        totalCount: initialData.totalCount,
        loading: false,
        status: "done",
        error: null,
      },
    });
  }

  // 상품 상세(initial product detail)용 데이터 복원
  if (initialData.currentProduct) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
      payload: initialData.currentProduct,
    });

    if (initialData.relatedProducts) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
        payload: initialData.relatedProducts,
      });
    }
  }
  // 초기 데이터를 소비한 뒤에 지우기로 결정
  // // 초기 데이터 정리
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

function hasRenderableChild(root: HTMLElement) {
  return Array.from(root.childNodes).some((node) => node.nodeType === Node.ELEMENT_NODE);
}
function main() {
  (router as Router<FunctionComponent>).start();

  const rootElement = document.getElementById("root")!;

  const shouldHydrate = typeof window !== "undefined" && hasRenderableChild(rootElement);

  console.log("shouldHydrate", shouldHydrate);
  if (shouldHydrate) {
    console.log("Hydrate");
    hydrateRoot(rootElement, <App />);
  } else {
    console.log("Create");
    createRoot(rootElement).render(<App />);
  }

  // 초기 데이터 정리
  // if (typeof window !== "undefined" && window.__INITIAL_DATA__) {
  //   delete window.__INITIAL_DATA__;
  // }
  // createRoot(rootElement).render(<App />);
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
