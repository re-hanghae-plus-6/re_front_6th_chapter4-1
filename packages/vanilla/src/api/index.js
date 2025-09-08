import { ClientProductApi, ServerProductApi } from "./productApis.js";

const isServer = typeof window === "undefined";
const api = isServer ? new ServerProductApi() : new ClientProductApi();

export const getProducts = (params) => api.getProducts(params);
export const getProduct = (productId) => api.getProduct(productId);
export const getCategories = () => api.getCategories();
