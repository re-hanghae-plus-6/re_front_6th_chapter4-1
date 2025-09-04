import { useSyncExternalStore } from "react";

/** SSR에서도 안전하게 동작: 세 번째 인자가 비면 getSnapshot을 재사용 */
export function useSSRSafeExternalStore<T>(
  subscribe: (listener: () => void) => () => void,
  getSnapshot: () => T,
  getServerSnapshot?: () => T,
) {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot ?? getSnapshot);
}
