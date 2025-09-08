import { createObserver } from "./createObserver";
import type { AnyFunction, StringRecord } from "./types";

interface Route<Handler extends AnyFunction> {
  regex: RegExp;
  paramNames: string[];
  handler: Handler;
  params?: StringRecord;
}

type QueryPayload = Record<string, string | number | undefined>;

export abstract class BaseRouter<Handler extends AnyFunction> {
  readonly #routes: Map<string, Route<Handler>>;
  readonly #observer = createObserver();
  readonly #baseUrl: string;

  #route: null | (Route<Handler> & { params: StringRecord; path: string });

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#route = null;
    this.#baseUrl = baseUrl.replace(/\/$/, "");
  }

  get baseUrl() {
    return this.#baseUrl;
  }

  get params() {
    return this.#route?.params ?? {};
  }

  get route() {
    return this.#route;
  }

  get target() {
    return this.#route?.handler;
  }

  readonly subscribe = this.#observer.subscribe;

  addRoute(path: string, handler: Handler) {
    const paramNames: string[] = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1));
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    // normalizedPath와 매칭하므로 baseUrl을 포함하지 않음
    const regex = new RegExp(`^${regexPath}$`);

    this.#routes.set(path, {
      regex,
      paramNames,
      handler,
    });
  }

  findRoute(url: string) {
    try {
      const { pathname } = new URL(url || "/", this.getOrigin());
      const normalizedPath = this.#baseUrl ? pathname.replace(this.#baseUrl, "") || "/" : pathname;

      for (const [routePath, route] of this.#routes) {
        const match = normalizedPath.match(route.regex);

        if (match) {
          const params: StringRecord = {};
          route.paramNames.forEach((name, index) => {
            params[name] = match[index + 1];
          });

          return { ...route, params, path: routePath };
        }
      }
      return null;
    } catch (error) {
      console.error("❌ findRoute 에러:", error);
      return null;
    }
  }

  updateRoute(url: string) {
    this.#route = this.findRoute(url);
    this.#observer.notify();
  }

  // 추상 메서드들 - 하위 클래스에서 구현
  abstract get query(): StringRecord;
  abstract set query(newQuery: QueryPayload);
  abstract getCurrentUrl(): string;
  abstract getOrigin(): string;
  abstract start(): void;

  static parseQuery = (search: string) => {
    const params = new URLSearchParams(search);
    const query: StringRecord = {};
    for (const [key, value] of params) {
      query[key] = value;
    }
    return query;
  };

  static stringifyQuery = (query: QueryPayload) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
    return params.toString();
  };

  static getUrl = (newQuery: QueryPayload, baseUrl = "", pathname = "", search = "") => {
    const currentQuery = BaseRouter.parseQuery(search);
    const updatedQuery = { ...currentQuery, ...newQuery };

    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = BaseRouter.stringifyQuery(updatedQuery);
    return `${baseUrl}${pathname.replace(baseUrl, "")}${queryString ? `?${queryString}` : ""}`;
  };
}
