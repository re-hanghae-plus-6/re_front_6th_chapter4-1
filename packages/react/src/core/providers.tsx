import { type ComponentProps, type PropsWithChildren } from "react";
import { ModalProvider, ToastProvider } from "../components";
import { useLoadCartStore } from "../entities";
import { ProductProvider } from "../entities/products/context";
import { RouterContext } from "./router/context";
import type { UniversalRouter } from "./router/universal-router";

type Props = Pick<ComponentProps<typeof ProductProvider>, "productStore"> &
  Pick<ComponentProps<typeof RouterProvider>, "router">;

export const RouterProvider = ({ children, router }: PropsWithChildren<{ router: UniversalRouter }>) => {
  return <RouterContext value={router}>{children}</RouterContext>;
};

export const Providers = ({ children, productStore, router }: PropsWithChildren<Props>) => {
  useLoadCartStore();

  return (
    <RouterProvider router={router}>
      <ProductProvider productStore={productStore}>
        <ToastProvider>
          <ModalProvider>{children}</ModalProvider>
        </ToastProvider>
      </ProductProvider>
    </RouterProvider>
  );
};
