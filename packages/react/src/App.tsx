import { router, useCurrentPage } from "./router";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { PRODUCT_ACTIONS, productStore, useLoadCartStore } from "./entities";
import { ModalProvider, ToastProvider } from "./components";
import { getProducts, getUniqueCategories, getDetailProduct } from "./mocks/serverMock";

// 홈 페이지 (상품 목록)
router.addRoute("/", () => {
  if (typeof window === "undefined") {
    const {
      products,
      pagination: { total },
    } = getProducts(router.query);

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
    const product = getDetailProduct(router.params.id);
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
      payload: product,
    });

    if (product) {
      const response = getProducts({ category2: router.params.category2 });

      // 현재 상품 제외
      const relatedProducts = response.products.filter((product) => product.productId !== router.params.id);

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
        payload: relatedProducts,
      });
    }
  }
  return ProductDetailPage();
});
router.addRoute(".*", () => {
  return NotFoundPage();
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
