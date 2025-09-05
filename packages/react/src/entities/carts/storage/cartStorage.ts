import { createStorage } from "@hanghae-plus/lib";
import type { Cart } from "../types";

const createMemoryStorage = (): Storage => {
  const store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
  } as Storage;
};

const memoryStorage = createMemoryStorage();

export const cartStorage = createStorage<{
  items: Cart[];
  selectedAll: boolean;
}>("shopping_cart", typeof window !== "undefined" ? window.localStorage : memoryStorage);
