import { serverStorage } from "../../react/src/lib/ServerStorage.ts";
import { isServer } from "../../react/src/utils/envUtils.ts";
import { createObserver } from "./createObserver.ts";

export const createStorage = <T>(key: string) => {
  const selectedStorage = isServer ? serverStorage : window.localStorage;

  let data: T | null = JSON.parse((selectedStorage.getItem(key) as string) ?? "null");
  const { subscribe, notify } = createObserver();

  const get = () => data;

  const set = (value: T) => {
    try {
      data = value;
      selectedStorage.setItem(key, JSON.stringify(data));
      notify();
    } catch (error) {
      console.error(`Error setting storage item for key "${key}":`, error);
    }
  };

  const reset = () => {
    try {
      data = null;
      selectedStorage.removeItem(key);
      notify();
    } catch (error) {
      console.error(`Error removing storage item for key "${key}":`, error);
    }
  };

  return { get, set, reset, subscribe };
};
