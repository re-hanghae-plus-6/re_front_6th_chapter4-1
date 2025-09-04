import { App } from "./App";
import { router } from "./router";
import { BASE_URL } from "./constants.ts";
import { createRoot } from "react-dom/client";
import { productStore, PRODUCT_ACTIONS } from "./entities/products/productStore";

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

  // SSR에서 전달된 초기 데이터 확인
  const initialData = (window as any).__INITIAL_DATA__;
  
  if (initialData) {
    // 초기 데이터가 있으면 스토어에 설정
    if (initialData.products) {
      // 홈페이지 데이터
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_PRODUCTS,
        payload: {
          products: initialData.products,
          totalCount: initialData.totalCount
        }
      });
      
      if (initialData.categories) {
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SET_CATEGORIES,
          payload: initialData.categories
        });
      }
    } else if (initialData.product) {
      // 상품 상세 페이지 데이터
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
        payload: initialData.product
      });
      
      if (initialData.relatedProducts) {
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
          payload: initialData.relatedProducts
        });
      }
    }
  }

  const rootElement = document.getElementById("root")!;
  createRoot(rootElement).render(<App />);
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
