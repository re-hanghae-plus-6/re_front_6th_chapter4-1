import { App } from "./App";
import { router } from "./router";
import { BASE_URL } from "./constants.ts";
import { createRoot, hydrateRoot } from "react-dom/client";

const enableMocking = () =>
  import("./mocks/browser").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

/**
 * 서버에서 전달받은 초기 데이터로 클라이언트 상태 복원 (하이드레이션)
 * 바닐라 JavaScript의 hydrateFromServerData 패턴을 React로 적용
 */
function hydrateFromServerData() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).__INITIAL_DATA__) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (window as any).__INITIAL_DATA__;

    // 스토어별 하이드레이션 처리
    hydrateStores(data);

    console.log("클라이언트 하이드레이션 완료 - SSR 데이터로 상태 복원:", {
      dataKeys: Object.keys(data),
    });

    // 초기 데이터 정리
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).__INITIAL_DATA__;
  } else {
    console.log("SSR 데이터 없음 - 클라이언트 전용 모드");
  }
}

/**
 * 각 스토어에 SSR 데이터를 복원
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hydrateStores(data: any) {
  // productStore 하이드레이션
  if (data.products || data.categories || data.currentProduct || data.relatedProducts) {
    hydrateProductStore(data);
  }

  // 다른 스토어들도 필요시 추가...
}

/**
 * productStore 하이드레이션
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hydrateProductStore(data: any) {
  // 동적 import로 스토어 로드 (순환 참조 방지)
  import("./entities").then(({ productStore, PRODUCT_ACTIONS }) => {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        ...data,
        loading: false, // SSR 데이터가 있으면 로딩 상태 없음
        error: null,
        status: "done",
      },
    });

    console.log("productStore 하이드레이션 완료:", {
      productsCount: data.products?.length || 0,
      categoriesCount: Object.keys(data.categories || {}).length,
      hasCurrentProduct: !!data.currentProduct,
      relatedProductsCount: data.relatedProducts?.length || 0,
    });
  });
}

/**
 * 하이드레이션 모드 감지
 */
function isSSRMode() {
  // SSR에서 렌더링된 경우 root 엘리먼트에 이미 콘텐츠가 있음
  const rootElement = document.getElementById("root");
  return rootElement && rootElement.innerHTML.trim().length > 0;
}

function main() {
  // 1. 서버 데이터로 상태 복원 (하이드레이션)
  hydrateFromServerData();

  // 2. 라우터 시작 (클라이언트에서만)
  if (router && typeof router.start === "function") {
    router.start();
  }

  // 3. React 앱 렌더링/하이드레이션
  const rootElement = document.getElementById("root")!;

  if (isSSRMode()) {
    // SSR 모드: 하이드레이션
    console.log("하이드레이션 모드 - 서버 렌더링된 HTML을 인터랙티브로 변환");
    hydrateRoot(rootElement, <App />);
  } else {
    // CSR 모드: 클라이언트 렌더링
    console.log("CSR 모드 - 클라이언트에서 처음부터 렌더링");
    createRoot(rootElement).render(<App />);
  }
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
