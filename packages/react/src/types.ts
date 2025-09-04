import type { Categories, Product } from "./entities";

export type StringRecord = Record<string, string>;
export type AnyFunction = (...args: unknown[]) => unknown;

declare global {
  interface Window {
    __INITIAL_DATA__?: {
      products?: Product[];
      categories?: Categories;
      totalCount?: number;
      loading?: boolean;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      error?: any;
      currentProduct?: Product | null;
      relatedProducts?: Product[];
    };
  }
}
