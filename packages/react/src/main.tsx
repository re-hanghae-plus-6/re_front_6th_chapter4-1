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
// SSR 데이터를 전역에 저장 (컴포넌트에서 접근 가능)
let globalSSRData: { products?: unknown[]; categories?: Record<string, unknown>; totalCount?: number } | null = null;

async function hydrateFromServerData() {
  console.log("🔄 하이드레이션 시작...");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((window as any).__INITIAL_DATA__) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (window as any).__INITIAL_DATA__;

    // 🚨 중요: 삭제하기 전에 전역 변수에 저장
    globalSSRData = data;

    console.log("📦 SSR 초기 데이터 발견:", {
      dataKeys: Object.keys(data),
      productsCount: data.products?.length || 0,
      categoriesCount: Object.keys(data.categories || {}).length,
    });

    // 🚨 중요한 하이드레이션 과정 알림
    alert(
      `📦 SSR 초기 데이터 발견!\n상품: ${data.products?.length || 0}개\n카테고리: ${Object.keys(data.categories || {}).length}개\n하이드레이션 진행 중...`,
    );

    // 스토어별 하이드레이션 처리
    await hydrateStores(data);

    console.log("✅ 클라이언트 하이드레이션 완료 - SSR 데이터로 상태 복원!");

    // 하이드레이션 완료 알림
    alert("✅ 하이드레이션 완료!\nSSR 데이터로 상태 복원 완료");

    // 초기 데이터 정리 (이제 globalSSRData에 저장됨)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).__INITIAL_DATA__;
  } else {
    console.log("⚠️ SSR 데이터 없음 - 클라이언트 전용 모드");
    alert("⚠️ SSR 데이터 없음!\n클라이언트 전용 모드로 실행");
  }
}

// SSR 데이터 접근을 위한 헬퍼 함수
export function getGlobalSSRData() {
  return globalSSRData;
}

/**
 * 각 스토어에 SSR 데이터를 복원
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function hydrateStores(data: any) {
  // productStore 하이드레이션
  if (data.products || data.categories || data.currentProduct || data.relatedProducts) {
    await hydrateProductStore(data);
  }

  // 다른 스토어들도 필요시 추가...
}

/**
 * productStore 하이드레이션
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function hydrateProductStore(data: any) {
  // 동적 import로 스토어 로드 (순환 참조 방지)
  const { productStore, PRODUCT_ACTIONS } = await import("./entities");

  // 하이드레이션 전 스토어 상태 확인
  const beforeState = productStore.getState();
  console.log("🔍 하이드레이션 전 productStore 상태:", {
    productsCount: beforeState.products?.length || 0,
    categoriesCount: Object.keys(beforeState.categories || {}).length,
    loading: beforeState.loading,
    status: beforeState.status,
  });

  // 🚨 스토어 하이드레이션 진행 상황 알림
  if (beforeState.loading) {
    console.log("⚠️ 스토어가 로딩 상태임 - SSR 데이터로 덮어쓰기");
    alert(`⚠️ 스토어 로딩 상태 감지!\n현재 스토어 로딩: ${beforeState.loading}\nSSR 데이터로 덮어쓰기 진행`);
  }

  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: {
      ...data,
      loading: false, // SSR 데이터가 있으면 로딩 상태 없음
      error: null,
      status: "done",
    },
  });

  // 하이드레이션 후 스토어 상태 확인
  const afterState = productStore.getState();
  console.log("✅ 하이드레이션 후 productStore 상태:", {
    productsCount: afterState.products?.length || 0,
    categoriesCount: Object.keys(afterState.categories || {}).length,
    loading: afterState.loading,
    status: afterState.status,
    hasCurrentProduct: !!afterState.currentProduct,
    relatedProductsCount: afterState.relatedProducts?.length || 0,
  });

  // 🚨 하이드레이션 결과 상세 알림
  alert(
    `🔧 productStore 하이드레이션 완료!\n이전 로딩: ${beforeState.loading} → 현재 로딩: ${afterState.loading}\n상품: ${afterState.products?.length || 0}개\n카테고리: ${Object.keys(afterState.categories || {}).length}개`,
  );
}

/**
 * 하이드레이션 모드 감지
 */
function isSSRMode() {
  // SSR에서 렌더링된 경우 root 엘리먼트에 이미 콘텐츠가 있음
  const rootElement = document.getElementById("root");
  return rootElement && rootElement.innerHTML.trim().length > 0;
}

async function main() {
  console.log("main() 시작");

  // 1. 서버 데이터로 상태 복원 (하이드레이션) - React 렌더링 전에 완료
  await hydrateFromServerData();

  // 2. 라우터 시작 (클라이언트에서만)
  if (router && typeof router.start === "function") {
    router.start();
  }

  // 3. React 앱 렌더링/하이드레이션 - 하이드레이션 완료 후 실행
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

  console.log("main() 완료");
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(() => main());
} else {
  main();
}
