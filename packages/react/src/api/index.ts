import type { Categories, Product } from "../entities";
import type { StringRecord } from "../types";
import * as mock from "./mockApi";
import * as real from "./productApi";

const isSSR = typeof window === "undefined";
const isDev = typeof import.meta !== "undefined" && import.meta.env && import.meta.env.DEV;
const useMock = isSSR || !isDev;

export const getProducts = (params: StringRecord = {}) =>
  useMock ? mock.getProducts(params) : real.getProducts(params);

export const getProduct = (productId: string): Promise<Product> =>
  useMock ? mock.getProduct(productId) : real.getProduct(productId);

export const getCategories = (): Promise<Categories> => (useMock ? mock.getCategories() : real.getCategories());
