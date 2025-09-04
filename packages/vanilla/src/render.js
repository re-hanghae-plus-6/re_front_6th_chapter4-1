import { cartStore, productStore, uiStore } from "./stores";
import { router } from "./router";
import { registerRoutes } from "./router/routes";
import { withBatch } from "./utils";

// 클라이언트에서만 라우트 등록
if (typeof window !== "undefined") {
  registerRoutes(router);
}

/**
 * 전체 애플리케이션 렌더링
 */
export const render = withBatch(() => {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;

  const PageComponent = router.target;

  // App 컴포넌트 렌더링
  rootElement.innerHTML = PageComponent();
});

/**
 * 렌더링 초기화 - Store 변화 감지 설정
 */
export function initRender() {
  // 각 Store의 변화를 감지하여 자동 렌더링
  productStore.subscribe(render);
  cartStore.subscribe(render);
  uiStore.subscribe(render);
  router.subscribe(render);
}
