import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";
import { BASE_URL } from "./constants.ts";
import { PRODUCT_ACTIONS, productStore } from "./entities/products/productStore.ts";
import { router } from "./router/index.ts";

// MSW(Mock Service Worker) 활성화 함수
const enableMocking = () =>
  import("./mocks/browser.ts").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`, // 서비스 워커 파일 경로
      },
      onUnhandledRequest: "bypass", // 처리되지 않은 요청은 실제 네트워크로 전달
    }),
  );

async function main() {
  // CSR 환경에서 라우트 등록
  const { HomePage, NotFoundPage, ProductDetailPage } = await import("./pages");
  router.addRoute("/", HomePage);
  router.addRoute("/product/:id/", ProductDetailPage);
  router.addRoute(".*", NotFoundPage);

  // 클라이언트 사이드 라우터 시작
  router.start();

  // 라우터 초기화 대기 (약간의 지연)
  await new Promise((resolve) => setTimeout(resolve, 100));

  // CSR 모드 확인
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isSSR = !!(window as any)?.__INITIAL_DATA__;
  console.log(isSSR ? "🔄 CSR 하이드레이션 모드" : "🚀 CSR 초기 렌더링 모드");

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

    // 초기 데이터가 있으므로 로딩 상태를 false로 설정
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_LOADING,
      payload: false,
    });

    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_STATUS,
      payload: "done",
    });
  }

  // React 앱을 DOM에 마운트 (하이드레이션)
  const rootElement = document.getElementById("root")!;

  // SSR 주석 제거 (CSR에서 문제 방지)
  rootElement.innerHTML = "";

  createRoot(rootElement).render(<App />);
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  // 테스트 환경이 아닌 경우: MSW 활성화 후 앱 시작
  enableMocking().then(() => main());
} else {
  // 테스트 환경: MSW 없이 바로 앱 시작
  main();
}
