/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    __spyCalls: any[];
    __spyCallsClear: () => void;
  }
}

// SSR 환경 체크
const isClient = typeof window !== "undefined";

if (isClient) {
  window.__spyCalls = [];
  window.__spyCallsClear = () => {
    window.__spyCalls = [];
  };
}

export const log: typeof console.log = (...args) => {
  if (isClient) {
    window.__spyCalls.push(args);
  }
  return console.log(...args);
};
