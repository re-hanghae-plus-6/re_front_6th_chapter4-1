import type { ComponentProps, PropsWithChildren } from "react";
import { ProductProvider } from "../entities/products/context";
import { RouterProvider } from "../router";

type Props = Pick<ComponentProps<typeof ProductProvider>, "productStore"> &
  Pick<ComponentProps<typeof RouterProvider>, "router">;

export const Providers = ({ children, productStore, router }: PropsWithChildren<Props>) => {
  return (
    <RouterProvider router={router}>
      <ProductProvider productStore={productStore}>{children}</ProductProvider>
    </RouterProvider>
  );
};
