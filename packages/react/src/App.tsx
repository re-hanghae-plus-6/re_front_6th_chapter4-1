import { router, useCurrentPage } from "./router";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { useLoadCartStore } from "./entities";
import { ModalProvider, ToastProvider } from "./components";

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
export const App = () => {
  const PageComponent = useCurrentPage();

  // 서버에서 전달받은 초기 데이터 확인
  const initialData =
    typeof window !== "undefined" ? (window as unknown as Record<string, unknown>).__INITIAL_DATA__ : null;

  // 서버 데이터가 있으면 직접 렌더링
  if (initialData && (initialData as Record<string, unknown>).products) {
    const data = initialData as Record<string, unknown>;
    return (
      <div>
        <h1>쇼핑몰</h1>
        <p>총 {data.totalCount as string}개</p>
        <div>
          {(data.products as Array<Record<string, unknown>>).map((product) => (
            <div key={product.productId as string}>
              <h3>{product.title as string}</h3>
              <p>{product.lprice as string}원</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <ToastProvider>
        <ModalProvider>{PageComponent ? <PageComponent /> : null}</ModalProvider>
      </ToastProvider>
      <CartInitializer />
    </>
  );
};
