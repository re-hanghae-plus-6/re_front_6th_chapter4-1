import { createContext, useContext } from "react";
import type { ServerRouter } from "../ServerRouter";

export const RouterContext = createContext<ServerRouter | null>(null);

export const useRouterContext = () => {
  const router = useContext(RouterContext);

  if (!router) {
    throw new Error("Router context not found");
  }

  return router;
};
