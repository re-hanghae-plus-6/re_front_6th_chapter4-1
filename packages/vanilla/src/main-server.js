import serverRouter from "./lib/ServerRouter.js";
import { ErrorPage } from "./pages/ErrorPage.js";

import { cartStore } from "./stores/cartStore.js";
import { productStore } from "./stores/productStore.js";
import { uiStore } from "./stores/uiStore.js";

async function prefetchPageData(route, params) {
  if (!route) return;

  try {
    const result = await route.handler(params); // { page: Component}
    return result;
  } catch (error) {
    console.error("Prefetch error:", error);
    return { page: ErrorPage };
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
      const notFoundRoute = serverRouter.findRoute("/404");
      const result = await notFoundRoute.handler();
      const html = await result.page();

      return { html, head: "", initialData: {} };
    }

    // 3. 데이터 프리페칭
    const result = await prefetchPageData(route, route.params);

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
    return {
      html: `<div>Server Error: ${error}</div>`,
      head: "",
      initialData: {},
    };
  }
}
