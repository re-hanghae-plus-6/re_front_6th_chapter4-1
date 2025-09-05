import { router, useCurrentPage } from "./router";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { useLoadCartStore } from "./entities";
import { ModalProvider, ToastProvider } from "./components";

// 홈 페이지 (상품 목록)
router.addRoute("/", HomePage);
router.addRoute("/product/:id", ProductDetailPage);
router.addRoute("/product/:id/", ProductDetailPage);
router.addRoute("*", NotFoundPage);

const CartInitializer = () => {
  if (typeof window !== "undefined") {
    useLoadCartStore();
  }
  return null;
};

/**
 * 클라이언트 사이드 애플리케이션
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

/**
 * 서버 사이드 애플리케이션
 */
const ServerApp = ({ url }: { url?: string }) => {
  const splitUrl = (url ?? "").split("/").filter((segment) => segment !== "");

  let PageComponent = HomePage;

  if (splitUrl?.[0] === "product") {
    PageComponent = ProductDetailPage;
  } else if ((url ?? "").split("?")[0] === "" || url === "/" || url === "") {
    PageComponent = HomePage;
  } else {
    PageComponent = NotFoundPage;
  }

  console.log("ServerApp 렌더링:", { url, PageComponent: PageComponent.name });

  return (
    <ToastProvider>
      <ModalProvider>
        <PageComponent />
      </ModalProvider>
    </ToastProvider>
  );
};

export const App = ({ url }: { url?: string } = {}) => {
  const isServer = typeof window === "undefined";
  return isServer ? <ServerApp url={url} /> : <ClientApp />;
};
