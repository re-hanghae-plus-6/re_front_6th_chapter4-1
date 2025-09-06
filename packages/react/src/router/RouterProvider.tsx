import type { RouterInstance } from "@hanghae-plus/lib";
import type { FC, PropsWithChildren } from "react";

import { RouterContext } from "./hooks";

type RouterProviderProps = PropsWithChildren<{
  router: RouterInstance<FC>;
}>;

export function RouterProvider({ children, router }: RouterProviderProps) {
  return <RouterContext value={router}>{children}</RouterContext>;
}
