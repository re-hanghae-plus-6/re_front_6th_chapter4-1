/**
 * 서버 사이드 렌더링을 위한 임시 스토어들
 * 요청별로 독립적인 상태를 생성하고 관리
 */

/**
 * 서버에서 사용할 임시 상품 스토어 생성
 * @param {Object} initialData - 서버에서 미리 로드한 상품 데이터
 */
export function createServerProductStore(initialData = {}) {
  const state = {
    products: initialData.products || [],
    currentProduct: initialData.currentProduct || null,
    categories: initialData.categories || {},
    loading: false,
    error: null,
    totalCount: initialData.pagination?.total || 0,
    filters: initialData.filters || {
      search: "",
      category1: "",
      category2: "",
      sort: "price_asc",
      limit: 20,
    },
  };

  return {
    getState: () => state,
    dispatch: () => {}, // 서버에서는 상태 변경 불필요
    subscribe: () => () => {}, // 서버에서는 구독 불필요
  };
}

/**
 * 서버에서 사용할 임시 장바구니 스토어 생성
 */
export function createServerCartStore() {
  const state = {
    items: [], // 서버에서는 빈 장바구니로 시작
  };

  return {
    getState: () => state,
    dispatch: () => {},
    subscribe: () => () => {},
  };
}

/**
 * 서버에서 사용할 임시 UI 스토어 생성
 */
export function createServerUiStore() {
  const state = {
    cartModal: {
      isOpen: false,
    },
    toast: null,
  };

  return {
    getState: () => state,
    dispatch: () => {},
    subscribe: () => () => {},
  };
}

/**
 * 서버 렌더링을 위한 모든 스토어를 초기화
 * @param {Object} initialData - 서버에서 프리페치한 데이터
 * @returns {Object} 서버용 스토어들
 */
export function createServerStores(initialData = {}) {
  return {
    productStore: createServerProductStore(initialData),
    cartStore: createServerCartStore(),
    uiStore: createServerUiStore(),
  };
}
