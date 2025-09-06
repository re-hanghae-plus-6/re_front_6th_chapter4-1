import type { AnyFunction, StringRecord } from "../types";

interface Route<Handler extends AnyFunction> {
  regex: RegExp;
  paramNames: string[];
  handler: Handler;
  params?: StringRecord;
}

interface CurrentRouter<Handler extends AnyFunction> extends Route<Handler> {
  params: StringRecord;
  path: string;
}

type QueryPayload = Record<string, string | number | undefined>;

export class ServerRouter<Handler extends AnyFunction> {
  static parseQuery(search = {}) {
    const params = new URLSearchParams(search);
    const query: StringRecord = {};

    for (const [key, value] of params) {
      query[key] = value;
    }

    return query;
  }

  static stringifyQuery(query: QueryPayload) {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }

    return params.toString();
  }

  static getUrl(newQuery: QueryPayload, baseUrl = "", pathname = "/") {
    const currentQuery = ServerRouter.parseQuery();
    const updatedQuery = { ...currentQuery, ...newQuery };

    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = ServerRouter.stringifyQuery(updatedQuery);
    const url = `${baseUrl}${pathname.replace(baseUrl, "")}${queryString ? `?${queryString}` : ""}`;

    return url;
  }

  private readonly _routes = new Map<string, Route<Handler>>();
  private readonly baseUrl;
  private currentRoute: CurrentRouter<Handler> | null = null;
  private currentUrl = "/";
  private _query: StringRecord = {};

  constructor(initRoutes: Record<string, Handler>, baseUrl = "") {
    this.baseUrl = baseUrl.replace(/\/$/, "");

    Object.entries(initRoutes).forEach(([path, page]) => {
      this.addRoute(path, page);
    });
  }

  get query(): StringRecord {
    return this._query;
  }

  set query(newQuery: QueryPayload) {
    this._query = newQuery as StringRecord;
  }

  get params() {
    return this.currentRoute?.params ?? {};
  }

  get route() {
    return this.currentRoute;
  }

  get target() {
    return this.currentRoute?.handler;
  }

  get subscribe() {
    return (fn: AnyFunction) => () => fn();
  }

  get routes() {
    return this._routes;
  }

  public addRoute(path: string, handler: Handler) {
    if (path === "*") {
      const regex = new RegExp(".*");
      this._routes.set(path, {
        regex,
        paramNames: [],
        handler,
      });

      return;
    }

    // 경로 패턴을 정규식으로 변환
    const paramNames: string[] = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1)); // ':id' -> 'id'
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${regexPath}$`);

    this._routes.set(path, {
      regex,
      paramNames,
      handler,
    });
  }

  public push(url: string) {
    this.currentUrl = url;

    try {
      const fullUrl = url.startsWith(this.baseUrl) ? url : this.baseUrl + (url.startsWith("/") ? url : "/" + url);
      this.currentRoute = this.findRoute(fullUrl);
    } catch (error) {
      console.error("라우터 네비게이션 오류:", error);
    }
  }

  public start() {
    this.currentRoute = this.findRoute("/");
  }

  private findRoute(url = this.baseUrl) {
    const { pathname } = new URL(url, "http://localhost");

    const pathToMatch =
      this.baseUrl && pathname.startsWith(this.baseUrl) ? pathname.slice(this.baseUrl.length) || "/" : pathname;

    for (const [routePath, route] of this._routes) {
      const match = pathToMatch.match(route.regex);
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
}
