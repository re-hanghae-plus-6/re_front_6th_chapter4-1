import { router, useCurrentPage } from "./router";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { useLoadCartStore } from "./entities";
import { ModalProvider, ToastProvider } from "./components";

// 홈 페이지 (상품 목록)
router.addRoute("/", HomePage);
router.addRoute("/product/:id", ProductDetailPage);
router.addRoute("*", NotFoundPage);

const CartInitializer = () => {
  useLoadCartStore();
  return null;
};

/**
 * 전체 애플리케이션 렌더링
 */
const ClientApp = () => {
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

const ServerApp = () => {
  return (
    <ToastProvider>
      <ModalProvider>
        <HomePage />
      </ModalProvider>
    </ToastProvider>
  );
};

export const App = () => {
  const isServer = typeof window === "undefined";
  return isServer ? <ServerApp /> : <ClientApp />;
};
