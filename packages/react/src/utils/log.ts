/* eslint-disable @typescript-eslint/no-explicit-any */
declare global {
  interface Window {
    __spyCalls: any[];
    __spyCallsClear: () => void;
  }
}

// 브라우저 환경에서만 spy 기능 초기화
const initializeSpy = () => {
  if (typeof window !== "undefined") {
    window.__spyCalls = [];
    window.__spyCallsClear = () => {
      window.__spyCalls = [];
    };
  }
};

// 모듈 로드 시 초기화
initializeSpy();

export const log: typeof console.log = (...args) => {
  if (typeof window !== "undefined" && window.__spyCalls) {
    window.__spyCalls.push(args);
  }
  return console.log(...args);
};
