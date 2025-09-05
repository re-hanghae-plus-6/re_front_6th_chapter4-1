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

  private readonly routes = new Map<string, Route<Handler>>();
  private readonly baseUrl;
  private currentRoute: CurrentRouter<Handler> | null = null;
  private currentUrl = "/";

  constructor(initRoutes: Record<string, Handler>, baseUrl = "") {
    this.baseUrl = baseUrl.replace(/\/$/, "");

    Object.entries(initRoutes).forEach(([path, page]) => {
      this.addRoute(path, page);
    });
  }

  get query(): StringRecord {
    if (!this.currentUrl) {
      throw new Error("setter를 통해 url 값을 할당해 주세요!");
    }

    return ServerRouter.parseQuery(this.currentUrl);
  }

  set query(newQuery: QueryPayload) {
    const newUrl = ServerRouter.getUrl(newQuery, this.currentUrl, this.baseUrl);
    this.push(newUrl);
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

  public addRoute(path: string, handler: Handler) {
    if (path === "*") {
      const regex = new RegExp(".*");
      this.routes.set(path, {
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

    this.routes.set(path, {
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

    for (const [routePath, route] of this.routes) {
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
}
