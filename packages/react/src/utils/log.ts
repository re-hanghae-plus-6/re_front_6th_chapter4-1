/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    __spyCalls: any[];
    __spyCallsClear: () => void;
  }
}

// window는 클라이언트 사이드에서만 정의되므로, 서버 사이드에서는 정의하지 않음
if (typeof window !== "undefined") {
  window.__spyCalls = [];
  window.__spyCallsClear = () => {
    window.__spyCalls = [];
  };
}

export const log: typeof console.log = (...args) => {
  if (typeof window !== "undefined") {
    window.__spyCalls.push(args);
  }
  return console.log(...args);
};
