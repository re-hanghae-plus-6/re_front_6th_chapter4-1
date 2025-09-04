import type { ServerRouter } from "./ServerRouter";
import { RouterContext } from "./hooks/useRouterContext";

interface Props {
  router: ServerRouter;
  children: React.ReactNode;
}

export const RouterProvider = ({ children, router }: Props) => {
  return <RouterContext value={router}>{children}</RouterContext>;
};
