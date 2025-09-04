import type { FC } from "react";
import { createObserver } from "./createObserver";
import type { AnyFunction, StringRecord } from "./types";

interface Route<Handler extends FC> {
  regex: RegExp;
  paramNames: string[];
  handler: Handler;
  params?: StringRecord;
}

const isClient = typeof window !== "undefined";

type QueryPayload = Record<string, string | number | undefined>;

export type RouterInstance<T extends AnyFunction> = InstanceType<typeof Router<T>>;

export class Router<Handler extends FC> {
  readonly #routes: Map<string, Route<Handler>>;
  readonly #observer = createObserver();
  readonly #baseUrl;
  #serverQuery: StringRecord = {};

  #route: null | (Route<Handler> & { params: StringRecord; path: string });

  constructor(initRoutes: Record<string, Handler>, baseUrl = "") {
    this.#routes = new Map();
    this.#route = null;
    this.#baseUrl = baseUrl.replace(/\/$/, "");

    Object.entries(initRoutes).forEach(([path, page]) => {
      this.addRoute(path, page);
    });

    if (isClient) {
      window.addEventListener("popstate", () => {
        this.#route = this.#findRoute();
        this.#observer.notify();
      });

      document.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (!target?.closest("[data-link]")) {
          return;
        }
        e.preventDefault();
        const url = target.getAttribute("href") ?? target.closest("[data-link]")?.getAttribute("href");
        if (url) {
          this.push(url);
        }
      });
    }
  }

  get query(): StringRecord {
    if (typeof window !== "undefined") {
      return Router.parseQuery(window.location.search);
    }
    return this.#serverQuery;
  }

  set query(newQuery: QueryPayload) {
    if (isClient) {
      const newUrl = Router.getUrl(newQuery, this.#baseUrl);
      this.push(newUrl);
    } else {
      this.#serverQuery = Object.entries(newQuery).reduce((acc, [key, value]) => {
        if (value !== null && value !== undefined && value !== "") {
          acc[key] = String(value);
          return acc;
        }
        return acc;
      }, {} as StringRecord);
    }
  }

  get params() {
    return this.#route?.params ?? {};
  }

  set params(newParams: StringRecord) {
    this.#route ??= {} as Route<Handler> & { params: StringRecord; path: string };
    this.#route.params = newParams;
  }

  get route() {
    return this.#route;
  }

  get target() {
    return this.#route?.handler;
  }

  readonly subscribe = this.#observer.subscribe;

  addRoute<T>(path: string, handler: FC<T>) {
    // 경로 패턴을 정규식으로 변환
    const paramNames: string[] = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1)); // ':id' -> 'id'
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex = isClient ? new RegExp(`^${this.#baseUrl}${regexPath}$`) : new RegExp(`^${regexPath}$`);

    this.#routes.set(path, {
      regex,
      paramNames,
      handler: handler as Handler,
    });
  }

  #findRoute(url?: string) {
    const pathname = url
      ? new URL(url, "http://localhost").pathname
      : typeof window !== "undefined"
        ? window.location.pathname
        : "/";

    for (const [routePath, route] of this.#routes) {
      const match = pathname.match(route.regex);
      if (match) {
        const params: StringRecord = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        return {
          ...route,
          params,
          path: routePath,
        };
      }
    }
    return null;
  }

  push(url: string) {
    if (!isClient) return;

    try {
      const fullUrl = url.startsWith(this.#baseUrl) ? url : this.#baseUrl + (url.startsWith("/") ? url : "/" + url);

      const prevFullUrl = `${window.location.pathname}${window.location.search}`;

      if (prevFullUrl !== fullUrl) {
        window.history.pushState(null, "", fullUrl);
      }

      this.#route = this.#findRoute(fullUrl);
      this.#observer.notify();
    } catch (error) {
      console.error("라우터 네비게이션 오류:", error);
    }
  }

  start(url?: string) {
    this.#route = this.#findRoute(url);
    this.#observer.notify();
  }

  static parseQuery = (search?: string) => {
    const searchString = search || (isClient ? window.location.search : "");
    const params = new URLSearchParams(searchString);
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

  static getUrl = (newQuery: QueryPayload, baseUrl = "") => {
    const currentQuery = Router.parseQuery();
    const updatedQuery = { ...currentQuery, ...newQuery };

    // 빈 값들 제거
    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = Router.stringifyQuery(updatedQuery);
    const pathname = isClient ? window.location.pathname : "/";
    return `${baseUrl}${pathname.replace(baseUrl, "")}${queryString ? `?${queryString}` : ""}`;
  };
}
