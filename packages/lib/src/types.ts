import { Router } from "./Router";
import type { ServerRouter } from "./ServerRouter";

export type StringRecord = Record<string, string>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyFunction = (...args: any[]) => any;

export type Selector<T, S = T> = (state: T) => S;

export type RouterInstance<
  T extends AnyFunction,
  R extends typeof Router<T> | typeof ServerRouter<T> = typeof Router<T>,
> = InstanceType<R>;
