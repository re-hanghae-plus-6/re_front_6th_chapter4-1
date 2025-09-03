/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Product, Categories } from "../entities/products/types";
declare global {
  interface Window {
    __spyCalls: any[];
    __spyCallsClear: () => void;
    __INITIAL_DATA__?: {
      products: Product[];
      categories: Categories;
      totalCount: number;
      product: Product | null;
      relatedProducts: Product[];
      error: string | null;
    };
    __HYDRATED__?: boolean;
  }
}

// SSR 환경에서 안전하게 window 객체 초기화
if (typeof window !== "undefined") {
  window.__spyCalls = [];
  window.__spyCallsClear = () => {
    window.__spyCalls = [];
  };
}

export const log: typeof console.log = (...args) => {
  // SSR 환경에서는 window 객체에 접근하지 않음
  if (typeof window !== "undefined") {
    window.__spyCalls.push(args);
  }
  return console.log(...args);
};
