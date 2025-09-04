import { createStorage } from "@hanghae-plus/lib";
import type { Cart } from "../types";

// 강제로 타입 캐스팅?
const storage =
  typeof window !== "undefined"
    ? window.localStorage
    : ({ getItem: () => null, setItem: () => {}, removeItem: () => {} } as unknown as Storage);

export const cartStorage = createStorage<{
  items: Cart[];
  selectedAll: boolean;
}>("shopping_cart", storage);
