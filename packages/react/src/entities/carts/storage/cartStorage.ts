import { createStorage } from "@hanghae-plus/lib";
import { getStorage } from "../../../utils/serverStorage";
import type { Cart } from "../types";

export const cartStorage = createStorage<{
  items: Cart[];
  selectedAll: boolean;
}>("shopping_cart", getStorage());
