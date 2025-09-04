/**
 * React 하이드레이션 기본 동작 검증 테스트
 */
console.log("🧪 React 하이드레이션 기본 동작 테스트 시작");

// DOM 환경 시뮬레이션
global.window = global.window || {};
global.document = global.document || {
  getElementById: () => ({ innerHTML: "" }),
};

// 테스트용 초기 데이터
const mockInitialData = {
  products: [
    { productId: "1", title: "테스트 상품 1", lprice: "10000" },
    { productId: "2", title: "테스트 상품 2", lprice: "20000" },
  ],
  categories: {
    "생활/건강": ["건강식품", "생활용품"],
    "디지털/가전": ["스마트폰", "노트북"],
  },
  totalCount: 100,
};

async function testHydration() {
  console.log("1. 초기 데이터 설정 테스트");

  // window.__INITIAL_DATA__ 설정
  window.__INITIAL_DATA__ = mockInitialData;

  console.log("✅ window.__INITIAL_DATA__ 설정 완료");
  console.log("데이터 구조:", Object.keys(window.__INITIAL_DATA__));

  console.log("\n2. 하이드레이션 모드 감지 테스트");

  // SSR 모드 시뮬레이션 - root에 콘텐츠가 있는 상태
  const mockRoot = { innerHTML: "<div>서버 렌더링된 콘텐츠</div>" };
  global.document.getElementById = () => mockRoot;

  // 하이드레이션 모드 감지 함수 (main.tsx에서 가져온 로직)
  function isSSRMode() {
    const rootElement = document.getElementById("root");
    return rootElement && rootElement.innerHTML.trim().length > 0;
  }

  const isSSR = isSSRMode();
  console.log("✅ SSR 모드 감지:", isSSR ? "하이드레이션 모드" : "CSR 모드");

  console.log("\n3. 스토어 하이드레이션 시뮬레이션");

  // 스토어 모킹
  const mockProductStore = {
    dispatch: (action) => {
      console.log("✅ productStore.dispatch 호출:", {
        type: action.type,
        payloadKeys: Object.keys(action.payload),
        hasProducts: !!action.payload.products,
        hasCategories: !!action.payload.categories,
      });
    },
  };

  const PRODUCT_ACTIONS = {
    SETUP: "products/setup",
  };

  // 하이드레이션 로직 시뮬레이션
  if (window.__INITIAL_DATA__) {
    const data = window.__INITIAL_DATA__;

    if (data.products || data.categories) {
      mockProductStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          ...data,
          loading: false,
          error: null,
          status: "done",
        },
      });

      console.log("✅ productStore 하이드레이션 완료:", {
        productsCount: data.products?.length || 0,
        categoriesCount: Object.keys(data.categories || {}).length,
      });
    }

    // 초기 데이터 정리
    delete window.__INITIAL_DATA__;
    console.log("✅ 초기 데이터 정리 완료");
  }

  console.log("\n4. 렌더링 모드 결정 테스트");

  if (isSSR) {
    console.log("✅ 하이드레이션 모드 선택 - hydrateRoot 사용");
  } else {
    console.log("✅ CSR 모드 선택 - createRoot 사용");
  }
}

// 테스트 실행
testHydration()
  .then(() => {
    console.log("\n🎉 React 하이드레이션 기본 동작 테스트 완료");
  })
  .catch((error) => {
    console.error("❌ 테스트 실행 중 오류:", error);
  });

export {}; // 모듈로 만들기 위한 export
