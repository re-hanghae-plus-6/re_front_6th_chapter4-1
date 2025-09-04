import { useSyncExternalStore, useCallback } from "react";
import { router } from "../";

const subscribe = (callback: () => void) => router.subscribe(callback);

export const useRouterQuery = () => {
  const getSnapshot = useCallback(() => router.query, []);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
