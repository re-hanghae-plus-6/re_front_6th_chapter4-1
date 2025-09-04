import { router, useCurrentPage } from "./router";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { useLoadCartStore } from "./entities";
import { ModalProvider, ToastProvider } from "./components";
import { RouterProvider } from "./router/RouterProvider";
import { Router } from "@hanghae-plus/lib";
import type { FunctionComponent } from "react";

// 홈 페이지 (상품 목록)
router.addRoute("/", HomePage);
router.addRoute("/product/:id/", ProductDetailPage);
router.addRoute(".*", NotFoundPage);

const CartInitializer = () => {
  useLoadCartStore();
  return null;
};

/**
 * 전체 애플리케이션 렌더링
 */
const AppContent = () => {
  const PageComponent = useCurrentPage();

  return (
    <>
      <ToastProvider>
        <ModalProvider>{PageComponent ? <PageComponent /> : null}</ModalProvider>
      </ToastProvider>
      <CartInitializer />
    </>
  );
};

export const App = ({ router: routerProp }: { router?: Router<FunctionComponent> } = {}) => {
  const currentRouter = routerProp || router;

  return (
    <RouterProvider router={currentRouter}>
      <AppContent />
    </RouterProvider>
  );
};
