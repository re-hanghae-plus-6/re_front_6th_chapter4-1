/* eslint-disable @typescript-eslint/no-explicit-any */
import { createObserver } from "./createObserver";
import { isServer } from "./ssrUtils";
import type { AnyFunction, StringRecord } from "./types";

interface Route<Handler extends AnyFunction> {
  regex: RegExp;
  paramNames: string[];
  handler: Handler;
  params?: StringRecord;
}

type QueryPayload = Record<string, string | number | undefined>;

export type RouterInstance<T extends AnyFunction> = InstanceType<typeof Router<T>>;
export class Router<Handler extends (...args: any[]) => any> {
  [x: string]: any;
  readonly #routes: Map<string, Route<Handler>>;
  readonly #observer = createObserver();
  readonly #baseUrl;

  #route: null | (Route<Handler> & { params: StringRecord; path: string });
  readonly #isServer: boolean;

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#route = null;
    this.#baseUrl = baseUrl.replace(/\/$/, "");
    this.#isServer = isServer;

    if (!this.#isServer) {
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
    if (this.#isServer) {
      return {};
    }
    return Router.parseQuery(window.location.search);
  }

  set query(newQuery: QueryPayload) {
    const newUrl = Router.getUrl(newQuery, this.#baseUrl);
    this.push(newUrl);
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
    // '*' 전용 처리
    if (path === "*" || path === "/*") {
      this.#routes.set(path, {
        regex: new RegExp(`^${this.#baseUrl}.*$`),
        paramNames: [],
        handler,
      });
      return;
    }

    // 일반적인 파라미터(:id) 처리
    const paramNames: string[] = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1)); // ':id' -> 'id'
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${this.#baseUrl}${regexPath}$`);

    this.#routes.set(path, {
      regex,
      paramNames,
      handler,
    });
  }

  #findRoute(url?: string) {
    if (this.#isServer) {
      // SSR에서는 기본 라우트 반환
      const defaultRoute = this.#routes.get("/");
      if (defaultRoute) {
        return {
          ...defaultRoute,
          params: {},
          path: "/",
        };
      }
      return null;
    }

    const actualUrl = url || window.location.pathname;
    const { pathname } = new URL(actualUrl, window.location.origin);
    for (const [routePath, route] of this.#routes) {
      const match = pathname.match(route.regex);
      if (match) {
        // 매치된 파라미터들을 객체로 변환
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
    if (this.#isServer) {
      return;
    }

    try {
      // baseUrl이 없으면 자동으로 붙여줌
      const fullUrl = url.startsWith(this.#baseUrl) ? url : this.#baseUrl + (url.startsWith("/") ? url : "/" + url);

      const prevFullUrl = `${window.location.pathname}${window.location.search}`;

      // 히스토리 업데이트
      if (prevFullUrl !== fullUrl) {
        window.history.pushState(null, "", fullUrl);
      }

      this.#route = this.#findRoute(fullUrl);
      this.#observer.notify();
    } catch (error) {
      console.error("라우터 네비게이션 오류:", error);
    }
  }

  start() {
    this.#route = this.#findRoute();
    this.#observer.notify();
  }

  static parseQuery = (search?: string) => {
    if (isServer) {
      return {};
    }

    const actualSearch = search || window.location.search;
    const params = new URLSearchParams(actualSearch);
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
    if (isServer) {
      return "/";
    }

    const currentQuery = Router.parseQuery();
    const updatedQuery = { ...currentQuery, ...newQuery };

    // 빈 값들 제거
    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = Router.stringifyQuery(updatedQuery);
    return `${baseUrl}${window.location.pathname.replace(baseUrl, "")}${queryString ? `?${queryString}` : ""}`;
  };
}
