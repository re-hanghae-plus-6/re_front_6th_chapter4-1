import { createStorage } from "../lib";
import { serverStorage } from "../lib/ServerStorage";
import { isServer } from "../utils/envUtils";

export const cartStorage = createStorage("shopping_cart", isServer ? serverStorage : window.localStorage);
