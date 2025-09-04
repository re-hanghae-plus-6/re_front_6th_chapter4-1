import type { RouterInstance } from "../Router";
import type { AnyFunction } from "../types";
import { useSyncExternalStore } from "react";
import { useShallowSelector } from "./useShallowSelector";

const defaultSelector = <T, S = T>(state: T) => state as unknown as S;

export const useRouter = <T extends RouterInstance<AnyFunction>, S>(router: T, selector = defaultSelector<T, S>) => {
  const shallowSelector = useShallowSelector(selector);

  // 서버 환경에서도 동작하도록 getServerSnapshot 제공
  const getSnapshot = () => shallowSelector(router);
  const getServerSnapshot = () => shallowSelector(router);

  return useSyncExternalStore(router.subscribe, getSnapshot, getServerSnapshot);
};
