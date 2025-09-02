import { ModalProvider, ToastProvider } from "./components";
import { useLoadCartStore } from "./entities";
import { useCurrentPage } from "./router";

const CartInitializer = () => {
  useLoadCartStore();
  return null;
};

interface Props {
  data?: unknown;
}

/**
 * 전체 애플리케이션 렌더링
 */
export const App = ({ data }: Props) => {
  const PageComponent = useCurrentPage();

  return (
    <>
      <ToastProvider>
        <ModalProvider>
          {PageComponent ? (
            // @ts-expect-error initialData is unknowns
            <PageComponent data={data} />
          ) : null}
        </ModalProvider>
      </ToastProvider>
      <CartInitializer />
    </>
  );
};
