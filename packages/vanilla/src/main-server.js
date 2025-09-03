import serverRouter from "./lib/ServerRouter.js";
import { cartStore, productStore, uiStore } from "./stores";

export async function render(pathname, query) {
  try {
    // 1. 스토어 초기화 (매번 새로운 인스턴스)
    productStore.dispatch({ type: "RESET" });
    cartStore.dispatch({ type: "RESET" });
    uiStore.dispatch({ type: "RESET" });

    // 2. 라우트 매칭
    serverRouter.start(pathname);

    // 3. 데이터 프리페칭
    const params = { pathname, query, params: serverRouter.params };
    const data = await serverRouter.target.prefetch(params);
    const head = "";
    const metaData = "";

    // 4. HTML 생성 - 프리패치된 데이터를 페이지 컴포넌트에 전달
    // ! 문제: 프리패치되어있어야하는 html이 카테고리 로딩 중..이 표시됨
    // ! 원인: 프리패치된 데이터를 사용하지 않음
    // ! 해결: 프리패치된 데이터를 페이지 컴포넌트에 전달
    const html = await serverRouter.target(data);

    return { html, head, metaData, initialData: data };
  } catch (error) {
    console.error("Render error:", error);
    return {
      html: `<div>Server Error: ${error.message}</div>`,
      head: "",
      initialData: {},
    };
  }
}
