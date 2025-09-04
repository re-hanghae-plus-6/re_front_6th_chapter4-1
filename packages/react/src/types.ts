export type StringRecord = Record<string, string>;
export type AnyFunction = (...args: unknown[]) => unknown;

declare global {
  interface Window {
    __INITIAL_DATA__?: {
      products?: unknown[];
      categories?: Record<string, Record<string, unknown>>;
      totalCount?: number;
      currentProduct?: unknown;
      relatedProducts?: unknown[];
      params?: Record<string, string>;
      query?: Record<string, string>;
    };
  }
}
