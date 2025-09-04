export type StringRecord = Record<string, string>;
export type AnyFunction = (...args: unknown[]) => unknown;

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    __INITIAL_DATA__?: any;
  }
}
