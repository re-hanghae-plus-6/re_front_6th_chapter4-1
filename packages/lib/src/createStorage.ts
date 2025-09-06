import { createObserver } from "./createObserver.ts";
import type { StringRecord } from "./types.ts";

export const createMemoryStorage = (): Storage => {
  let storage: StringRecord = {};

  return {
    getItem: (key: string) => storage[key] ?? null,
    setItem: (key: string, value: string) => (storage[key] = value),
    removeItem: (key: string) => delete storage[key],
    clear: () => (storage = {}),
    key: (index: number) => Object.keys(storage)[index] ?? null,
    get length() {
      return Object.keys(storage).length;
    },
  };
};

export const createStorage = <T>(
  key: string,
  storage = typeof window === "undefined" ? createMemoryStorage() : window.localStorage,
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
