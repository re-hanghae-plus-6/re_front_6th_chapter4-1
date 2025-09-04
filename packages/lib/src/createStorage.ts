import { createObserver } from "./createObserver.ts";

export const createStorage = <T>(key: string, storage = typeof window !== 'undefined' ? window.localStorage : null) => {
  let data: T | null = null;
  
  // SSR 환경에서는 storage가 null일 수 있음
  if (storage) {
    try {
      data = JSON.parse(storage.getItem(key) ?? "null");
    } catch (error) {
      console.error(`Error parsing storage item for key "${key}":`, error);
      data = null;
    }
  }
  
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
