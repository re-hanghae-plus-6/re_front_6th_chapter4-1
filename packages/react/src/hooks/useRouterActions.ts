import { useRouterContext } from "../router/RouterProvider";

export const useRouterActions = () => {
  const router = useRouterContext();

  return {
    setQuery: (query: Record<string, string>) => {
      router.query = query;
    },
    getQuery: () => router.query,
    getRoute: () => router.route,
    getParams: () => router.params,
  };
};
