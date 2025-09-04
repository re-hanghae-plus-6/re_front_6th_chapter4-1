import { createContext, useContext } from "react";
import type { UniversalRouter } from "./universal-router";

export const RouterContext = createContext<UniversalRouter | null>(null);

export const useRouterContext = () => {
  const router = useContext(RouterContext);

  if (!router) {
    throw new Error("Router context not found");
  }

  return router;
};
