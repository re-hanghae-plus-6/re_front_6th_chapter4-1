import serverRouter from "./lib/ServerRouter.js";
import { ErrorPage } from "./pages/ErrorPage.js";
import { cartStore, productStore, uiStore } from "./stores";

async function prefetchPageData(route, params) {
  if (!route) return;

  try {
    const result = await route.handler(params); // { page: Component, data: {...} }
    return result;
  } catch (error) {
    console.error("Prefetch error:", error);
    return { page: ErrorPage, data: {} };
  }
}

export async function render(url) {
  try {
    // 1. 스토어 초기화 (매번 새로운 인스턴스)
    productStore.dispatch({ type: "RESET" });
    cartStore.dispatch({ type: "RESET" });
    uiStore.dispatch({ type: "RESET" });

    // 2. 라우트 매칭
    const route = serverRouter.findRoute(url);

    if (!route) {
      const notFoundRoute = serverRouter.findRoute("/404");
      const result = await notFoundRoute.handler();
      const html = await result.page(result.data);

      return { html, head: "", initialData: result.data };
    }

    // 3. 데이터 프리페칭
    const result = await prefetchPageData(route, route.params);

    // 4. HTML 생성 - 프리패치된 데이터를 페이지 컴포넌트에 전달
    // ! 문제: 프리패치되어있어야하는 html이 카테고리 로딩 중..이 표시됨
    // ! 원인: 프리패치된 데이터를 사용하지 않음
    // ! 해결: 프리패치된 데이터를 페이지 컴포넌트에 전달
    const html = await result.page(result.data);

    // 5. 초기 데이터 준비
    const initialData = {
      ...result.data,
      cart: cartStore.getState(),
      ui: uiStore.getState(),
    };

    return { html, head: "", initialData: initialData };
  } catch (error) {
    console.error("Render error:", error);
    return {
      html: `<div>Server Error: ${error.message}</div>`,
      head: "",
      initialData: {},
    };
  }
}
