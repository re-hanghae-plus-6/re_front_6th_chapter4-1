import type { AnyFunction, StringRecord } from "./types";

interface Route<Handler extends AnyFunction> {
  regex: RegExp;
  paramNames: string[];
  handler: Handler;
  params?: StringRecord;
}

type QueryPayload = Record<string, string | number | undefined>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class ServerRouter<Handler extends (...args: any[]) => any> {
  readonly #routes: Map<string, Route<Handler>>;
  readonly #baseUrl;

  #route: null | (Route<Handler> & { params: StringRecord; path: string });
  #currentUrl = "/";
  #query: StringRecord = {};

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#route = null;
    this.#baseUrl = baseUrl.replace(/\/$/, "");
  }

  get query(): StringRecord {
    return this.#query;
  }

  set query(newQuery: QueryPayload) {
    const newUrl = ServerRouter.getUrl(newQuery, this.#currentUrl, this.#baseUrl);
    this.push(newUrl);
    this.#query = newQuery as StringRecord;
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

  addRoute(path: string, handler: Handler) {
    // 경로 패턴을 정규식으로 변환
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

  #findRoute(url = this.#baseUrl) {
    const { pathname } = new URL(url, "http://localhost");
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
    this.#currentUrl = url;
    try {
      // baseUrl이 없으면 자동으로 붙여줌
      const fullUrl = url.startsWith(this.#baseUrl) ? url : this.#baseUrl + (url.startsWith("/") ? url : "/" + url);
      this.#route = this.#findRoute(fullUrl);
    } catch (error) {
      console.error("라우터 네비게이션 오류:", error);
    }
  }

  start() {
    this.#route = this.#findRoute();
  }

  static parseQuery = (search = {}) => {
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

  static getUrl = (newQuery: QueryPayload, pathname = "/", baseUrl = "") => {
    const currentQuery = ServerRouter.parseQuery();
    const updatedQuery = { ...currentQuery, ...newQuery };

    // 빈 값들 제거
    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = ServerRouter.stringifyQuery(updatedQuery);
    return `${baseUrl}${pathname.replace(baseUrl, "")}${queryString ? `?${queryString}` : ""}`;
  };
}
