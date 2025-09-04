import { createObserver } from "./createObserver.ts";
import { createMockStorage } from "./createMockStorage.ts";

export const createStorage = <T>(
  key: string,
  storage = typeof window !== "undefined" ? window.localStorage : createMockStorage(),
) => {
  let data: T | null = JSON.parse(storage.getItem(key) ?? "null");
  const { subscribe, notify } = createObserver();

  const get = () => data;

  const set = (value: T) => {
    try {
      data = value;
      storage.setItem(key, JSON.stringify(data));
      notify();
    } catch (error) {
      console.error(`Error setting storage item for key "${key}":`, error);
    }
  };

  const reset = () => {
    try {
      data = null;
      storage.removeItem(key);
      notify();
    } catch (error) {
      console.error(`Error removing storage item for key "${key}":`, error);
    }
  };

  return { get, set, reset, subscribe };
};
