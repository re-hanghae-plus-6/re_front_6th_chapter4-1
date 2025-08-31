import { createMemoryStorage, createStorage } from "../lib";

export const cartStorage = createStorage(
  "shopping_cart",
  typeof window === "undefined" ? createMemoryStorage() : window.localStorage,
);
