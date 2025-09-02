import serverRouter from "./lib/ServerRouter.js";
import { ErrorPage } from "./pages/ErrorPage.js";

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

    // 초기 데이터 준비 - 핸들러에서 반환된 데이터와 스토어 상태를 결합
    const initialData = result.data;

    return { html, head: "", initialData: initialData };
  } catch (error) {
    return {
      html: `<div>Server Error: ${error}</div>`,
      head: "",
      initialData: {},
    };
  }
}
