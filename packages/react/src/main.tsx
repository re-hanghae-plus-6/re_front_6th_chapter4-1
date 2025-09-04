import { createRoot } from "react-dom/client";
import { App } from "./App";
import { BASE_URL } from "./constants.ts";
import { PRODUCT_ACTIONS, productStore } from "./entities/products/productStore";
import { router } from "./router";

// MSW(Mock Service Worker) 활성화 함수
const enableMocking = () =>
  import("./mocks/browser").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`, // 서비스 워커 파일 경로
      },
      onUnhandledRequest: "bypass", // 처리되지 않은 요청은 실제 네트워크로 전달
    }),
  );

function main() {
  // 클라이언트 사이드 라우터 시작
  router.start();

  // SSR에서 전달된 초기 데이터 확인 (서버에서 미리 렌더링된 데이터)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const initialData = (window as any)?.__INITIAL_DATA__;

  if (initialData) {
    // SSR 초기 데이터가 있으면 클라이언트 스토어에 하이드레이션
    if (initialData.products) {
      // 홈페이지용 데이터: 상품 목록과 총 개수
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_PRODUCTS,
        payload: {
          products: initialData.products,
          totalCount: initialData.totalCount,
        },
      });

      // 카테고리 데이터가 있으면 추가 설정
      if (initialData.categories) {
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SET_CATEGORIES,
          payload: initialData.categories,
        });
      }
    } else if (initialData.product) {
      // 상품 상세 페이지용 데이터: 특정 상품 정보
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
        payload: initialData.product,
      });

      // 관련 상품 데이터가 있으면 추가 설정
      if (initialData.relatedProducts) {
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
          payload: initialData.relatedProducts,
        });
      }
    }
  }

  // React 앱을 DOM에 마운트 (하이드레이션)
  const rootElement = document.getElementById("root")!;
  createRoot(rootElement).render(<App />);
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  // 테스트 환경이 아닌 경우: MSW 활성화 후 앱 시작
  enableMocking().then(main);
} else {
  // 테스트 환경: MSW 없이 바로 앱 시작
  main();
}
