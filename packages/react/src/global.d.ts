import type { Product, Categories } from "./entities";

declare global {
  interface Window {
    __INITIAL_DATA__: GlobalInitialData;
  }
}

type GlobalInitialData = {
  initialData: {
    products: Product[];
    categories: Categories;
    totalCount: number;
    loading: boolean;
    error: string | null;
    currentProduct: Product | null;
    relatedProducts: Product[];
    status: "idle" | "done" | "error" | "pending";
    query: Record<string, string>;
  };
};

export { GlobalInitialData, GlobalSnapshot };
