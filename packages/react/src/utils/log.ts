import { isClient } from "@hanghae-plus/lib";

declare global {
  interface Window {
    __spyCalls: Parameters<typeof console.log>[0][];
    __spyCallsClear: () => void;
  }
}

if (isClient()) {
  window.__spyCalls = window.__spyCalls || [];
  window.__spyCallsClear = () => {
    window.__spyCalls = [];
  };
}

export const log: typeof console.log = (...args) => {
  if (isClient()) {
    window.__spyCalls.push(args);
  }

  return console.log(...args);
};
