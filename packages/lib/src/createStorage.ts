import { createObserver } from "./createObserver.ts";

const memoryStorage = (() => {
  const map = new Map<string, string>();
  return {
    getItem: (k: string) => (map.has(k) ? map.get(k) : null),
    setItem: (k: string, v: string) => map.set(k, v),
    removeItem: (k: string) => map.delete(k),
  };
})();

export const createStorage = <T>(key: string, storage?: Storage) => {
  const storageImpl =
    storage ?? (typeof window !== "undefined" && window?.localStorage ? window.localStorage : memoryStorage);
  let data: T | null = JSON.parse(storageImpl.getItem(key) ?? "null");
  const { subscribe, notify } = createObserver();

  const get = () => data;

  const set = (value: T) => {
    try {
      data = value;
      storageImpl.setItem(key, JSON.stringify(data));
      notify();
    } catch (error) {
      console.error(`Error setting storage item for key "${key}":`, error);
    }
  };

  const reset = () => {
    try {
      data = null;
      storageImpl.removeItem(key);
      notify();
    } catch (error) {
      console.error(`Error removing storage item for key "${key}":`, error);
    }
  };

  return { get, set, reset, subscribe };
};
