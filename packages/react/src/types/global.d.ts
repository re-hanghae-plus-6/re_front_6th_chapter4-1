// src/types/global.d.ts
export {};

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    __INITIAL_DATA__?: any;
  }
}
