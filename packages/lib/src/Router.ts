import { createObserver } from "./createObserver";
import type { AnyFunction, StringRecord } from "./types";

interface Route<Handler extends AnyFunction> {
  regex: RegExp;
  paramNames: string[];
  handler: Handler;
  params?: StringRecord;
}

type QueryPayload = Record<string, string | number | undefined>;

export type RouterInstance<T extends AnyFunction> = InstanceType<typeof Router<T>>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class Router<Handler extends (...args: any[]) => any> {
  readonly #routes: Map<string, Route<Handler>>;
  readonly #observer = createObserver();
  readonly #baseUrl;

  #route: null | (Route<Handler> & { params: StringRecord; path: string });

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#route = null;
    this.#baseUrl = baseUrl.replace(/\/$/, "");

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
      const raw = target.getAttribute("href") ?? target.closest("[data-link]")?.getAttribute("href");
      if (raw) {
        // baseUrl을 고려하여 절대 경로로 정규화
        const url = raw.startsWith(this.#baseUrl) ? raw : this.#baseUrl + (raw.startsWith("/") ? raw : "/" + raw);
        this.push(url);
      }
    });
  }

  get query(): StringRecord {
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
    // 경로 패턴을 정규식으로 변환
    const paramNames: string[] = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1)); // ':id' -> 'id'
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${regexPath}$`);

    this.#routes.set(path, {
      regex,
      paramNames,
      handler,
    });
  }

  #findRoute(url = window.location.pathname) {
    const { pathname } = new URL(url, window.location.origin);
    // baseUrl 제거 후 매칭
    const withoutBase = pathname.startsWith(this.#baseUrl) ? pathname.slice(this.#baseUrl.length) : pathname;
    const normalized = withoutBase === "" ? "/" : withoutBase;
    for (const [routePath, route] of this.#routes) {
      const match = normalized.match(route.regex);
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

  static parseQuery = (search = window.location.search) => {
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

  static getUrl = (newQuery: QueryPayload, baseUrl = "") => {
    const currentQuery = Router.parseQuery();
    const updatedQuery: Record<string, unknown> = { ...currentQuery, ...newQuery };

    // 빈 값 제거
    Object.keys(updatedQuery).forEach((key) => {
      const value = updatedQuery[key];
      if (value === null || value === undefined || value === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = Router.stringifyQuery(updatedQuery as QueryPayload);

    // 경로 정규화: baseUrl 제거 후 항상 슬래시로 시작, 빈 경우 "/"
    const pathname = window.location.pathname;
    const withoutBase = pathname.startsWith(baseUrl) ? pathname.slice(baseUrl.length) : pathname;
    const normalizedPath = withoutBase === "" ? "/" : withoutBase.startsWith("/") ? withoutBase : `/${withoutBase}`;

    return `${baseUrl}${normalizedPath}${queryString ? `?${queryString}` : ""}`;
  };
}
