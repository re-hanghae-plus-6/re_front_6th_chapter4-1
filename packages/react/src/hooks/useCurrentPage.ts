import { useCallback, useSyncExternalStore } from "react";
import { router, type RouteHandler } from "../core/router";

const subscribe = (callback: () => void) => router.subscribe(callback);

export const useCurrentPage = (): RouteHandler | undefined => {
  const getSnapshot = useCallback(() => router.target, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
