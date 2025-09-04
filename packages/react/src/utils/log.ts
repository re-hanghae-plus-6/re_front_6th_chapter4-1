/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    __spyCalls: any[];
    __spyCallsClear: () => void;
  }
}

// SSR 환경에서는 window 객체가 없을 수 있으므로 체크
if (typeof window !== 'undefined') {
  window.__spyCalls = [];
  window.__spyCallsClear = () => {
    window.__spyCalls = [];
  };
}

export const log: typeof console.log = (...args) => {
  if (typeof window !== 'undefined') {
    window.__spyCalls.push(args);
  }
  return console.log(...args);
};
