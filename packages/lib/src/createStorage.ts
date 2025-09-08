import { createObserver } from "./createObserver.ts";

export const createStorage = <T>(key: string, storage = typeof window !== "undefined" ? window.localStorage : null) => {
  let data: T | null = storage ? JSON.parse(storage.getItem(key) ?? "null") : null;
  const { subscribe, notify } = createObserver();

  const get = () => data;

  const set = (value: T) => {
    try {
      data = value;
      if (storage) {
        storage.setItem(key, JSON.stringify(data));
      }
      notify();
    } catch (error) {
      console.error(`Error setting storage item for key "${key}":`, error);
    }
  };

  const reset = () => {
    try {
      data = null;
      if (storage) {
        storage.removeItem(key);
      }
      notify();
    } catch (error) {
      console.error(`Error removing storage item for key "${key}":`, error);
    }
  };

  return { get, set, reset, subscribe };
};
