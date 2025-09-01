import { createSSRStorage, createStorage } from "../lib";

export const cartStorage =
  typeof window !== "undefined" ? createStorage("shopping_cart") : createSSRStorage("shopping_cart");
