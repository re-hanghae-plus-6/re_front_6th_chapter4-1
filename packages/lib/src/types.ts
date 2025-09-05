import type { ServerRouter, SPARouter } from "./router";

export type StringRecord = Record<string, string>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFunction = (...args: any[]) => any;

export type Selector<T, S = T> = (state: T) => S;

export type RouterInstance<
  T extends AnyFunction,
  R extends typeof SPARouter<T> | typeof ServerRouter<T> = typeof SPARouter<T> | typeof ServerRouter<T>,
> = InstanceType<R>;
