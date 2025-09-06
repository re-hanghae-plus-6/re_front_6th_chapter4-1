import type { HomePageData, ProductDetailData } from "./ssr-data";

declare global {
  interface Window {
    __INITIAL_DATA__?: {
      type: "home" | "product" | "notfound";
      data: HomePageData | ProductDetailData | null;
      url: string;
      filters?: {
        search: string;
        category1: string;
        category2: string;
        sort: string;
        limit: number;
        page: number;
      };
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    productStore?: any;
  }
}

export function hydrateFromServerData() {
  // window.__INITIAL_DATA__ 를 이용하여 서버에서 넘겨준 데이터를 클라이언트에서 그대로 사용
  if (typeof window !== "undefined" && window.__INITIAL_DATA__) {
    const initialData = window.__INITIAL_DATA__;
    hasHydrated = true;

    try {
      // 클라이언트 상태 복원
      if (initialData.type === "home") {
        const homeData = initialData.data as HomePageData;

        // 상품 스토어에 데이터 설정
        if (window.productStore) {
          window.productStore.setProducts(homeData.products);
          window.productStore.setCategories(homeData.categories);
          window.productStore.setTotalCount(homeData.totalCount);
          // 로딩 상태를 false로 설정 (서버에서 데이터를 받았으므로)
          window.productStore.dispatch({
            type: "SET_LOADING",
            payload: false,
          });
          window.productStore.dispatch({
            type: "SET_STATUS",
            payload: "done",
          });
        }

        // 필터 상태 복원
        if (initialData.filters) {
          const filters = initialData.filters;
          if (window.productStore) {
            window.productStore.setFilters(filters);
          }
        }

        console.log("Home page hydration completed:", {
          productsCount: homeData.products.length,
          totalCount: homeData.totalCount,
          categoriesCount: Object.keys(homeData.categories).length,
        });
      } else if (initialData.type === "product") {
        const productData = initialData.data as ProductDetailData;

        // 상품 상세 데이터 설정
        if (window.productStore) {
          window.productStore.setCurrentProduct(productData.product);
          window.productStore.setRelatedProducts(productData.relatedProducts);
          // 로딩 상태를 false로 설정 (서버에서 데이터를 받았으므로)
          window.productStore.dispatch({
            type: "SET_LOADING",
            payload: false,
          });
          window.productStore.dispatch({
            type: "SET_STATUS",
            payload: "done",
          });
        }

        console.log("Product detail page hydration completed:", {
          productId: productData.product.productId,
          relatedProductsCount: productData.relatedProducts.length,
        });
      }

      // 초기 데이터 정리 (메모리 누수 방지)
      delete window.__INITIAL_DATA__;
    } catch (error) {
      console.error("Hydration error:", error);
      // 하이드레이션 실패 시에도 앱이 정상 동작하도록 초기 데이터 삭제
      delete window.__INITIAL_DATA__;
    }
  }
}

// 서버 사이드에서 초기 데이터 설정
export function setInitialData(
  type: "home" | "product",
  data: HomePageData | ProductDetailData,
  url: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters?: any,
) {
  if (typeof window !== "undefined") {
    window.__INITIAL_DATA__ = {
      type,
      data,
      url,
      filters,
    };
  }
}

// 하이드레이션 상태 관리
let hasHydrated = false;

// 하이드레이션 불일치 방지를 위한 유틸리티
export function isHydrating(): boolean {
  return typeof window !== "undefined" && window.__INITIAL_DATA__ !== undefined;
}

export function hasServerData(): boolean {
  return hasHydrated;
}

// 안전한 클라이언트 전용 코드 실행
export function runOnClient(callback: () => void) {
  if (typeof window !== "undefined" && !isHydrating()) {
    callback();
  }
}

// 하이드레이션 완료 후 실행할 콜백들
const hydrationCallbacks: (() => void)[] = [];

export function onHydrationComplete(callback: () => void) {
  if (isHydrating()) {
    hydrationCallbacks.push(callback);
  } else {
    // 이미 하이드레이션이 완료된 경우 즉시 실행
    callback();
  }
}

export function completeHydration() {
  hydrationCallbacks.forEach((callback) => {
    try {
      callback();
    } catch (error) {
      console.error("Hydration callback error:", error);
    }
  });
  hydrationCallbacks.length = 0;
}
