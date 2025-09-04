import type { ComponentProps, PropsWithChildren } from "react";
import { ProductProvider } from "../entities/products/context";
import type { UniversalRouter } from "./router/universal-router";
import { RouterContext } from "./router/context";

type Props = Pick<ComponentProps<typeof ProductProvider>, "productStore"> &
  Pick<ComponentProps<typeof RouterProvider>, "router">;

export const RouterProvider = ({ children, router }: PropsWithChildren<{ router: UniversalRouter }>) => {
  return <RouterContext value={router}>{children}</RouterContext>;
};

export const Providers = ({ children, productStore, router }: PropsWithChildren<Props>) => {
  return (
    <RouterProvider router={router}>
      <ProductProvider productStore={productStore}>{children}</ProductProvider>
    </RouterProvider>
  );
};
