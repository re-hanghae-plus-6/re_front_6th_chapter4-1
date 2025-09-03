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
export const App = ({ router }: { router: Router<FunctionComponent> }) => {
  const PageComponent = useCurrentPage();

  return (
    <>
      <RouterProvider router={router}>
        <ToastProvider>
          <ModalProvider>{PageComponent ? <PageComponent /> : null}</ModalProvider>
        </ToastProvider>
        <CartInitializer />
      </RouterProvider>
    </>
  );
};
