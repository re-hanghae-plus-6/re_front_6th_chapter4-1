import type { ProductStoreState } from "./entities";

declare global {
  interface Window {
    __INITIAL_DATA__: GlobalSnapshot;
  }
}

type GlobalSnapshot = {
  snapshots: {
    productStore: ProductStoreState;
  };
};

export { GlobalSnapshot };
