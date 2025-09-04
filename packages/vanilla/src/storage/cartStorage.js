import { memoryStorage, createStorage } from "../lib/index.js";

export const cartStorage = createStorage(
  "shopping_cart",
  typeof window === "undefined" ? memoryStorage() : window.localStorage,
);
