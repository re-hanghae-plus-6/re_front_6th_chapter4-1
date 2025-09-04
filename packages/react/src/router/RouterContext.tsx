import type { RouterInstance } from "@hanghae-plus/lib";
import type { FC } from "react";
import { RouterContext } from "./hooks/useRouterContext";

interface RouterProviderProps {
  router: RouterInstance<FC>;
  children: React.ReactNode;
}

export const RouterProvider = ({ children, router }: RouterProviderProps) => {
  return <RouterContext value={router}>{children}</RouterContext>;
};
