/* eslint-disable @typescript-eslint/no-explicit-any */
import type { RouterInstance } from "../Router";
import type { AnyFunction } from "../types";
import { useSyncExternalStore } from "react";
import { useShallowSelector } from "./useShallowSelector";

const defaultSelector = <T, S = T>(state: T) => state as unknown as S;

export const useRouter = <T extends RouterInstance<AnyFunction>, S = T>(
  router: T,
  selector: (r: T) => S = defaultSelector as unknown as (r: T) => S,
) => {
  const shallowSelector = useShallowSelector(selector);

  // 라우터 인스턴스 자체를 읽는다 (getState 기대 X)
  const getSnapshot = () => shallowSelector(router);

  // subscribe는 필수. 없으면 no-op

  const subscribe = typeof (router as any).subscribe === "function" ? (router as any).subscribe : () => () => {};

  // ✅ SSR 호환: 3번째 인자(getServerSnapshot) 추가
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
};
