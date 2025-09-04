import { router, useCurrentPage, registerClientRoutes } from "./router";
import { useLoadCartStore } from "./entities";
import { ModalProvider, ToastProvider } from "./components";
import { isClient } from "./utils/runtime";

// 클라이언트에서만 라우트 등록
if (isClient) {
  registerClientRoutes(router);
}

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
