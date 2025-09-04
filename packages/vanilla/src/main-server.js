import { ServerRouter } from "./lib/ServerRouter.js";
import { mockGetProducts, mockGetProduct, mockGetCategories } from "./mocks/server.js";
import { productStore } from "./stores/productStore.js";
import { PRODUCT_ACTIONS } from "./stores/actionTypes.js";

// 스토어와 통합된 데이터 프리페칭 함수
async function prefetchData(route, query, params) {
  try {
    if (route.path === "/") {
      // 홈페이지: 상품 목록과 카테고리 데이터 미리 로드
      const productsData = mockGetProducts(query);
      const categories = mockGetCategories();

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: productsData.products,
          categories,
          totalCount: productsData.pagination.total,
          loading: false,
          status: "done",
          error: null,
        },
      });

      return {
        products: productsData.products,
        categories,
        totalCount: productsData.pagination.total,
      };
    } else if (route.path === "/product/:id/") {
      // 상품 상세 페이지: 해당 상품 데이터 미리 로드
      const productId = params.id;
      const product = mockGetProduct(productId);

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
        payload: product,
      });

      // 관련 상품도 로드
      let relatedProducts = [];
      if (product.category2) {
        try {
          const relatedData = mockGetProducts({
            category2: product.category2,
            limit: 20,
            page: 1,
          });
          relatedProducts = relatedData.products.filter((p) => p.productId !== productId);

          productStore.dispatch({
            type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
            payload: relatedProducts,
          });
        } catch (error) {
          console.error("관련 상품 로드 실패:", error);
        }
      }

      return {
        currentProduct: product,
        relatedProducts,
      };
    }
    return null;
  } catch (error) {
    console.error("데이터 프리페칭 오류:", error);
    return null;
  }
}

// 라우트 핸들러들
const routeHandlers = {
  // 홈페이지
  "/": async (url, params, query) => {
    try {
      // 라우트 정보 객체 생성
      const route = { path: "/" };

      // 데이터 프리페칭 및 스토어 업데이트
      const prefetchedData = await prefetchData(route, query, params);

      if (!prefetchedData) {
        throw new Error("데이터 프리페칭 실패");
      }

      // 스토어에서 현재 상태 가져오기
      const productState = productStore.getState();

      const initialData = {
        products: productState.products || [],
        totalCount: productState.totalCount || 0,
        categories: productState.categories || {},
        currentProduct: null,
        relatedProducts: [],
        loading: false,
        error: null,
        status: "done",
      };

      // 서버사이드 HTML 렌더링
      const { HomePage } = await import("./pages/HomePage.js");
      const html = HomePage(initialData);

      return {
        head: `<title>쇼핑몰 - 홈</title>`,
        html,
        initialData,
      };
    } catch (error) {
      console.error("홈페이지 렌더링 오류:", error);
      return {
        head: `<title>오류 - 쇼핑몰</title>`,
        html: `<div>서버 렌더링 중 오류가 발생했습니다: ${error.message}</div>`,
        initialData: { error: error.message },
      };
    }
  },

  // 상품 상세 페이지
  "/product/:id/": async (url, params, query) => {
    try {
      // 라우트 정보 객체 생성
      const route = { path: "/product/:id/" };

      // 데이터 프리페칭 및 스토어 업데이트
      const prefetchedData = await prefetchData(route, query, params);

      if (!prefetchedData) {
        throw new Error("상품 데이터를 찾을 수 없습니다");
      }

      // 스토어에서 현재 상태 가져오기
      const productState = productStore.getState();

      const initialData = {
        products: [],
        totalCount: 0,
        categories: productState.categories || {},
        currentProduct: productState.currentProduct,
        relatedProducts: productState.relatedProducts || [],
        loading: false,
        error: null,
        status: "done",
      };

      // 서버사이드 HTML 렌더링
      const { ProductDetailPage } = await import("./pages/ProductDetailPage.js");
      const html = ProductDetailPage(initialData);

      return {
        head: `<title>${productState.currentProduct?.title || "상품"} - 쇼핑몰</title>`,
        html,
        initialData,
      };
    } catch (error) {
      console.error("상품 상세 렌더링 오류:", error);
      return {
        head: `<title>상품을 찾을 수 없습니다 - 쇼핑몰</title>`,
        html: `<div>상품을 찾을 수 없습니다: ${error.message}</div>`,
        initialData: { error: error.message },
      };
    }
  },

  // 404 페이지
  ".*": async () => {
    try {
      // 서버사이드 HTML 렌더링
      const { NotFoundPage } = await import("./pages/NotFoundPage.js");
      const html = NotFoundPage();

      return {
        head: `<title>404 - 페이지를 찾을 수 없습니다</title>`,
        html,
        initialData: { error: "Page not found" },
      };
    } catch (error) {
      console.error("404 페이지 렌더링 오류:", error);
      return {
        head: `<title>404 - 페이지를 찾을 수 없습니다</title>`,
        html: `
          <div class="min-h-screen bg-gray-50 flex items-center justify-center">
            <div class="text-center">
              <h1 class="text-2xl font-bold text-gray-900 mb-4">404 - 페이지를 찾을 수 없습니다</h1>
              <a href="/" class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700">홈으로 돌아가기</a>
            </div>
          </div>
        `,
        initialData: { error: "Page not found" },
      };
    }
  },
};

export const render = async (url) => {
  try {
    const serverRouter = new ServerRouter(url);

    // 라우트 등록
    Object.entries(routeHandlers).forEach(([path, handler]) => {
      serverRouter.addRoute(path, handler);
    });

    // 라우팅 시작
    const route = serverRouter.start();

    if (!route) {
      return routeHandlers[".*"]();
    }

    // URL 쿼리 파라미터 가져오기
    const mergedQuery = { ...serverRouter.query };

    // 라우트 핸들러 실행
    const result = await route.handler(url, serverRouter.params, mergedQuery);

    return result;
  } catch (error) {
    console.error("SSR 렌더링 오류:", error);
    return {
      head: `<title>서버 오류 - 쇼핑몰</title>`,
      html: `<div>서버 렌더링 중 오류가 발생했습니다: ${error.message}</div>`,
      initialData: { error: error.message },
    };
  }
};
