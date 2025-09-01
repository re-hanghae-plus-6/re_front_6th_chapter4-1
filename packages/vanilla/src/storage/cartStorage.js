import { createStorage } from "../lib";
import { isServer } from "../utils/isServer.js";

export const cartStorage = createStorage("shopping_cart", !isServer ? window.localStorage : createStorage());
