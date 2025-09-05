import { ModalProvider, ToastProvider } from "./components";
import { useLoadCartStore } from "./entities";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { router, useCurrentPage } from "./router";

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
export const App = () => {
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
