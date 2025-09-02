import type { StringRecord } from "@hanghae-plus/lib";
import { useState } from "react";
import { ModalProvider, ToastProvider } from "./components";
import { useLoadCartStore } from "./entities";
import { router, useCurrentPage } from "./router";
import { isServer } from "./utils";

const CartInitializer = () => {
  useLoadCartStore();
  return null;
};

interface Props {
  data: unknown;
  query: StringRecord;
}

/**
 * 전체 애플리케이션 렌더링
 */
export const App = ({ data, query }: Props) => {
  useState(() => {
    if (isServer) {
      router.query = query;
    }
  });
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
