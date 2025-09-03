import { createContext, useContext } from "react";
import { Router } from "@hanghae-plus/lib";
import type { FunctionComponent } from "react";

const RouterContext = createContext<Router<FunctionComponent> | null>(null);

export const RouterProvider = ({
  children,
  router,
}: {
  children: React.ReactNode;
  router: Router<FunctionComponent>;
}) => {
  return <RouterContext.Provider value={router}>{children}</RouterContext.Provider>;
};

export const useRouterContext = () => {
  const router = useContext(RouterContext);
  if (!router) {
    throw new Error("Router must be provided via RouterProvider");
  }
  return router;
};
