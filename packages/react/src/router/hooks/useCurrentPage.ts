import { router } from "../";
import { useSyncExternalStore, useCallback } from "react";
import type { RouteHandler } from "../types";

const subscribe = (callback: () => void) => router.subscribe(callback);

export const useCurrentPage = (): RouteHandler | undefined => {
  const getSnapshot = useCallback(() => router.target, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
