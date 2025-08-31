import { getProduct, getProducts } from "./api/productApi.js";
import { HomePage } from "./pages/HomePage.js";
import { NotFoundPage } from "./pages/NotFoundPage.js";
import { ProductDetailPage } from "./pages/ProductDetailPage.js";

import { cartStore } from "./stores/cartStore.js";
import { productStore } from "./stores/productStore.js";
import { uiStore } from "./stores/uiStore.js";

class ServerRouter {
  constructor() {
    this.routes = new Map();
  }

  // 동적 라우트를 정규식으로 변환하여 저장
  addRoute(path, handler) {
    const paramNames = [];

    // 경로 정규화: 끝의 슬래시 제거
    const normalizedPath = path.replace(/\/$/, "");

    const regexPath = normalizedPath
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1));
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${regexPath}$`);

    this.routes.set(path, { regex, paramNames, handler });
  }

  // URL과 매칭되는 라우트 찾기
  findRoute(url) {
    for (const [routePath, route] of this.routes) {
      const match = url.match(route.regex);

      if (match) {
        const params = {};

        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        return { ...route, params, path: routePath };
      }
    }

    return null;
  }
}

// 서버 라우터 인스턴스 생성
const serverRouter = new ServerRouter();

// 라우트 등록 + 데이터 프리페칭
serverRouter.addRoute("/", async () => {
  // 홈페이지 - 상품 목록
  const products = await getProducts({ limit: 20 });

  productStore.dispatch({ type: "SETUP", payload: products });

  return { page: HomePage };
});

serverRouter.addRoute("/product/:id", async (params) => {
  // 상품 상세 페이지
  const product = await getProduct(params.id);

  productStore.dispatch({ type: "SET_CURRENT_PRODUCT", payload: product });

  return { page: ProductDetailPage, product };
});

serverRouter.addRoute("/404", async () => {
  return { page: NotFoundPage };
});

async function prefetchData(route, params) {
  if (!route) return;

  try {
    const result = await route.handler(params);

    return result;
  } catch (error) {
    console.error("Prefetch error:", error);

    return { page: "error" };
  }
}

export async function render(url) {
  try {
    // 1. Store 초기화
    productStore.dispatch({ type: "RESET" });
    cartStore.dispatch({ type: "RESET" });
    uiStore.dispatch({ type: "RESET" });

    // 2. 라우트 매칭
    const route = serverRouter.findRoute(url);

    if (!route) {
      // route 자체가 null일 때 404 처리 (분해구조할당 불가)
      const notFoundRoute = serverRouter.findRoute("/404");
      const result = await prefetchData(notFoundRoute, {});
      const html = await result.page();
      return { html, head: "", initialData: {} };
    }

    // 3. 데이터 프리페칭
    const result = await prefetchData(route, route.params);

    // 4. HTML 생성
    const html = await result.page();

    // 초기 데이터 준비
    const initialData = {
      products: productStore.getState().products,
      currentProduct: productStore.getState().currentProduct,
      cart: cartStore.getState(),
      ui: uiStore.getState(),
    };

    return { html, head: "", initialData: initialData };
  } catch (error) {
    console.error("Server render error:", error);

    return {
      html: "<div>Server Error</div>",
      head: "",
      initialData: {},
    };
  }
}
