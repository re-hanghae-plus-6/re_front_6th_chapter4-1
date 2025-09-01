import { createStorage, createServerStorage } from "../lib";

export const cartStorage = createStorage(
  "shopping_cart",
  typeof window === "undefined" ? createServerStorage() : window.localStorage,
);
