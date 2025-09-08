import { isServer } from "../utils";
import { createMemoryStorage, createStorage } from "../lib";

export const cartStorage = createStorage("shopping_cart", isServer ? createMemoryStorage() : window.localStorage);
