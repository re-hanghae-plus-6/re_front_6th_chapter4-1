import { memoryStorage, createStorage } from "../lib";

export const cartStorage = createStorage(
  "shopping_cart",
  typeof window === "undefined" ? memoryStorage() : window.localStorage,
);
