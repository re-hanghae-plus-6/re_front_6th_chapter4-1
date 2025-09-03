import { createStore } from "./lib/createStore.js";
import { PRODUCT_ACTIONS } from "./stores/actionTypes.js";
import { getCategories, getProduct, getProducts } from "./api/productApi.js";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages/index.js";

/**
 * 서버 사이드 라우터
 */
class ServerRouter {
  constructor() {
    this.routes = new Map();
  }

  addRoute(path, handler) {
    const paramNames = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1));
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${regexPath}$`);

    this.routes.set(path, {
      regex,
      paramNames,
      handler,
    });
  }

  findRoute(url) {
    const pathname = url.split("?")[0]; // 쿼리 파라미터 제거

    for (const [routePath, route] of this.routes) {
      const match = pathname.match(route.regex);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        return {
          ...route,
          params,
          path: routePath,
        };
      }
    }
    return null;
  }
}

// 서버 라우터 초기화
const serverRouter = new ServerRouter();
serverRouter.addRoute("/", HomePage);
serverRouter.addRoute("/product/:id/", ProductDetailPage);
serverRouter.addRoute("*", NotFoundPage);

/**
 * 서버에서 데이터 프리페칭
 */
async function prefetchData(route, params, query) {
  const productStore = createStore(
    (state, action) => {
      switch (action.type) {
        case PRODUCT_ACTIONS.SET_STATUS:
          return { ...state, status: action.payload };
        case PRODUCT_ACTIONS.SET_CATEGORIES:
          return { ...state, categories: action.payload, loading: false, error: null, status: "done" };
        case PRODUCT_ACTIONS.SET_PRODUCTS:
          return {
            ...state,
            products: action.payload.products,
            totalCount: action.payload.totalCount,
            loading: false,
            error: null,
            status: "done",
          };
        case PRODUCT_ACTIONS.SET_CURRENT_PRODUCT:
          return { ...state, currentProduct: action.payload, loading: false, error: null, status: "done" };
        case PRODUCT_ACTIONS.SET_RELATED_PRODUCTS:
          return { ...state, relatedProducts: action.payload, status: "done" };
        case PRODUCT_ACTIONS.SETUP:
          return { ...state, ...action.payload };
        default:
          return state;
      }
    },
    {
      products: [],
      totalCount: 0,
      currentProduct: null,
      relatedProducts: [],
      loading: true,
      error: null,
      status: "idle",
      categories: {},
    },
  );

  try {
    if (route.path === "/") {
      // 홈페이지: 상품 목록과 카테고리 로드
      const [productsResponse, categories] = await Promise.all([getProducts(query), getCategories()]);

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: productsResponse.products,
          totalCount: productsResponse.pagination.total,
          categories,
          loading: false,
          status: "done",
        },
      });
    } else if (route.path === "/product/:id/") {
      // 상품 상세 페이지: 상품 정보와 관련 상품 로드
      const product = await getProduct(params.id);

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
        payload: product,
      });

      // 관련 상품 로드
      if (product.category2) {
        const relatedResponse = await getProducts({
          category2: product.category2,
          limit: 20,
          page: 1,
        });

        const relatedProducts = relatedResponse.products.filter((p) => p.productId !== params.id);

        productStore.dispatch({
          type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
          payload: relatedProducts,
        });
      }
    }
  } catch (error) {
    console.error("서버 데이터 프리페칭 실패:", error);
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        loading: false,
        error: error.message,
        status: "done",
      },
    });
  }

  return productStore.getState();
}

/**
 * 서버 사이드 렌더링
 */
export const render = async (url, query = {}) => {
  console.log("서버 렌더링:", { url, query });

  try {
    // 1. 라우트 매칭
    const route = serverRouter.findRoute(url);
    if (!route) {
      return {
        head: `<title>404 - 페이지를 찾을 수 없습니다</title>`,
        html: `<div class="min-h-screen bg-gray-50 flex items-center justify-center">
          <div class="text-center">
            <h1 class="text-2xl font-bold text-gray-900 mb-4">404</h1>
            <p class="text-gray-600">페이지를 찾을 수 없습니다.</p>
          </div>
        </div>`,
        initialData: {},
      };
    }

    // 2. 데이터 프리페칭
    const initialData = await prefetchData(route, route.params, query);

    // 3. 페이지 컴포넌트 렌더링
    let html = "";
    let title = "쇼핑몰";
    let description = "온라인 쇼핑몰";

    if (route.path === "/") {
      title = "쇼핑몰 - 상품 목록";
      description = "다양한 상품을 만나보세요";
      html = route.handler();
    } else if (route.path === "/product/:id/") {
      const product = initialData.currentProduct;
      if (product) {
        title = `${product.title} - 쇼핑몰`;
        description = product.description || `${product.title} 상품 정보`;
      }
      html = route.handler();
    } else {
      html = route.handler();
    }

    return {
      head: `
        <title>${title}</title>
        <meta name="description" content="${description}">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      `,
      html,
      initialData,
    };
  } catch (error) {
    console.error("서버 렌더링 오류:", error);
    return {
      head: `<title>오류 - 쇼핑몰</title>`,
      html: `<div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-red-600 mb-4">오류가 발생했습니다</h1>
          <p class="text-gray-600">잠시 후 다시 시도해주세요.</p>
        </div>
      </div>`,
      initialData: {},
    };
  }
};
