import { RouterContext } from "../hooks/useRouterContext";
import type { UniversalRouter } from "../UniversalRouter";

interface Props {
  router: UniversalRouter;
  children: React.ReactNode;
}

export const RouterProvider = ({ children, router }: Props) => {
  return <RouterContext value={router}>{children}</RouterContext>;
};
