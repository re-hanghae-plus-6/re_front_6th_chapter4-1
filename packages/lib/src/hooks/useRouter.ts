import { useSyncExternalStore } from "react";
import { useShallowSelector } from "./useShallowSelector";
import type { AnyFunction, RouterInstance } from "../types";
import type { Router } from "../Router";
import type { ServerRouter } from "../ServerRouter";

const defaultSelector = <T, S = T>(state: T) => state as unknown as S;

export const useRouter = <R extends typeof Router | typeof ServerRouter, T extends RouterInstance<AnyFunction, R>, S>(
  router: T,
  selector = defaultSelector<T, S>,
) => {
  const shallowSelector = useShallowSelector(selector);
  return useSyncExternalStore(
    router.subscribe,
    () => shallowSelector(router),
    () => shallowSelector(router),
  );
};
