import { createStore, useStore } from "@hanghae-plus/lib";
import { initialProductState, productStore, type ProductStoreState } from "../productStore";
import { createContext, useContext } from "react";

export type ProductStore = ReturnType<typeof createStore<typeof initialProductState, unknown>>;

export const ProductStoreContext = createContext<ProductStore | null>(null);

export const useProductStore = (snapshot: ProductStoreState) => useStore(productStore, (state) => state, snapshot);

export const useProductStoreContext = () => {
  const productStore = useContext(ProductStoreContext);
  if (!productStore) {
    throw new Error("ProductStoreContext not found");
  }
  return productStore;
};
