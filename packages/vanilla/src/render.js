import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { routerInstance } from "./router";
import { cartStore, productStore, uiStore } from "./stores";
import { withBatch } from "./utils";

// 홈 페이지 (상품 목록)
routerInstance.addRoute("/", HomePage);
routerInstance.addRoute("/product/:id/", ProductDetailPage);
routerInstance.addRoute(".*", NotFoundPage);

/**
 * 전체 애플리케이션 렌더링
 */
export const render = withBatch(() => {
  const rootElement = document.getElementById("root");
  if (!rootElement) return;

  const PageComponent = routerInstance.target;

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
  routerInstance.subscribe(render);
}
