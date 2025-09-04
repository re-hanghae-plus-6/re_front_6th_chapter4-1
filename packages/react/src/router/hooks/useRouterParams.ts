import { router } from "../";
import { useSyncExternalStore, useCallback } from "react";

type Params = Record<string, string | undefined>;

const defaultSelector = <S>(params: Params) => params as S;
const subscribe = (callback: () => void) => router.subscribe(callback);

export const useRouterParams = <S>(selector = defaultSelector<S>) => {
  const getSnapshot = useCallback(() => selector(router.params), [selector]);

  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
