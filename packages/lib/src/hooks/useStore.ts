import type { createStore } from "../createStore";
import { useSyncExternalStore } from "react";
import { useShallowSelector } from "./useShallowSelector";

type Store<T> = ReturnType<typeof createStore<T>>;

const defaultSelector = <T, S = T>(state: T) => state as unknown as S;

export const useStore = <T, S = T>(store: Store<T>, selector: (state: T) => S = defaultSelector<T, S>) => {
  const shallowSelector = useShallowSelector(selector);

  // 서버 환경에서도 동작하도록 getServerSnapshot 제공
  const getSnapshot = () => shallowSelector(store.getState());
  const getServerSnapshot = () => shallowSelector(store.getState());

  return useSyncExternalStore(store.subscribe, getSnapshot, getServerSnapshot);
};
