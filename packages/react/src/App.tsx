import { useCurrentPage } from "./router";
import { HomePage } from "./pages";
import { useLoadCartStore } from "./entities";
import { ModalProvider, ToastProvider } from "./components";
import { useRouterQuery } from "./router";

const CartInitializer = () => {
  useLoadCartStore();
  return null;
};

/**
 * 전체 애플리케이션 렌더링
 */
export const App = () => {
  const PageComponent = useCurrentPage();
  const query = useRouterQuery();

  return (
    <>
      <ToastProvider>
        <ModalProvider>
          {PageComponent ? (
            <PageComponent />
          ) : (
            <HomePage
              searchQuery={query.search}
              limit={query.limit}
              sort={query.sort}
              category1={query.category1}
              category2={query.category2}
            />
          )}
        </ModalProvider>
      </ToastProvider>
      <CartInitializer />
    </>
  );
};
