import { createStorage } from "@hanghae-plus/lib";
import type { Cart } from "../types";

const storage =
  typeof window !== "undefined"
    ? window.localStorage
    : ({
        getItem: () => null,
        setItem: () => null,
        removeItem: () => null,
      } as unknown as Storage);

export const cartStorage = createStorage<{
  items: Cart[];
  selectedAll: boolean;
}>("shopping_cart", storage);
