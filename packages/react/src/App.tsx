import { router, useCurrentPage } from "./router";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { PRODUCT_ACTIONS, productStore, useLoadCartStore } from "./entities";
import { ModalProvider, ToastProvider } from "./components";
import { getProducts, getUniqueCategories } from "./mocks/serverMock";

// 홈 페이지 (상품 목록)
router.addRoute("/", () => {
  if (typeof window === "undefined") {
    const {
      products,
      pagination: { total },
    } = getProducts();

    const categories = getUniqueCategories();

    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        products,
        categories,
        totalCount: total,
        loading: false,
        status: "done",
      },
    });
  }
  return HomePage();
});
router.addRoute("/product/:id/", () => {
  if (typeof window === "undefined") {
    // data 불러오기.
  }
  return ProductDetailPage();
});
router.addRoute(".*", () => {
  NotFoundPage();
});

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
