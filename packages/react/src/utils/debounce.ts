import type { AnyFunction } from "@hanghae-plus/lib";

export const debounce = <T extends AnyFunction>(callback: T, delay: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      callback(...args);
      timeoutId = null;
    }, delay);
  };
};
