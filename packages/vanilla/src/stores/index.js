export * from "./actionTypes";
export * from "./cartStore";
export * from "./productStore";
export * from "./uiStore";

/**
 * SSR 초기 데이터로 상태 초기화
 */
export const initializeFromSSR = (initialData) => {
  console.log("🔄 SSR 초기 데이터로 상태 초기화 시작:", initialData);

  if (!initialData || !initialData.state) {
    console.log("⚠️ 유효하지 않은 초기 데이터");
    return;
  }

  const { type, state } = initialData;

  if (type === "home") {
    console.log("🏠 홈페이지 상태 초기화");
    // productStore와 uiStore 상태 초기화
    if (state.products) {
      productStore.dispatch({
        type: "SET_PRODUCTS",
        payload: state.products,
      });
    }
    if (state.categories) {
      productStore.dispatch({
        type: "SET_CATEGORIES",
        payload: state.categories,
      });
    }
    if (state.totalCount !== undefined) {
      productStore.dispatch({
        type: "SET_TOTAL_COUNT",
        payload: state.totalCount,
      });
    }
    if (state.query) {
      productStore.dispatch({
        type: "SET_QUERY",
        payload: state.query,
      });
    }
  } else if (type === "product-detail") {
    console.log("📦 상품 상세 상태 초기화");
    if (state.product) {
      productStore.dispatch({
        type: "SET_PRODUCT",
        payload: state.product,
      });
    }
    if (state.categories) {
      productStore.dispatch({
        type: "SET_CATEGORIES",
        payload: state.categories,
      });
    }
  }

  // UI 상태 초기화
  uiStore.dispatch({
    type: "SET_LOADING",
    payload: false,
  });

  uiStore.dispatch({
    type: "SET_STATUS",
    payload: "done",
  });

  console.log("✅ SSR 초기 데이터로 상태 초기화 완료");
};
