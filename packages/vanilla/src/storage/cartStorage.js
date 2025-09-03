import { createSSRStorage, createStorage } from "../lib/index.js";

export const cartStorage =
  typeof window !== "undefined" ? createStorage("shopping_cart") : createSSRStorage("shopping_cart");
