import { createObserver } from "../createObserver";
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

export class SPARouter<Handler extends AnyFunction> {
  static parseQuery(search = window.location.search) {
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

  static getUrl(newQuery: QueryPayload, baseUrl = "") {
    const currentQuery = SPARouter.parseQuery();
    const updatedQuery = { ...currentQuery, ...newQuery };

    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = SPARouter.stringifyQuery(updatedQuery);
    const url = `${baseUrl}${window.location.pathname.replace(baseUrl, "")}${queryString ? `?${queryString}` : ""}`;

    return url;
  }

  private readonly routes = new Map<string, Route<Handler>>();
  private readonly observer = createObserver();
  private readonly baseUrl;
  private currentRoute: CurrentRouter<Handler> | null = null;

  constructor(initRoutes: Record<string, Handler>, baseUrl = "") {
    this.baseUrl = baseUrl.replace(/\/$/, "");

    Object.entries(initRoutes).forEach(([path, page]) => {
      this.addRoute(path, page);
    });

    window.addEventListener("popstate", () => {
      this.currentRoute = this.findRoute();
      this.observer.notify();
    });

    document.addEventListener("click", (e) => {
      const target = e.target as HTMLElement;
      if (!target?.closest("[data-link]")) return;

      e.preventDefault();

      const url = target.getAttribute("href") ?? target.closest("[data-link]")?.getAttribute("href");
      if (url) this.push(url);
    });
  }

  get query(): StringRecord {
    return SPARouter.parseQuery(window.location.search);
  }

  set query(newQuery: QueryPayload) {
    const newUrl = SPARouter.getUrl(newQuery, this.baseUrl);
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
    return this.observer.subscribe;
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

    const regex = new RegExp(`^${this.baseUrl}${regexPath}$`);

    this.routes.set(path, {
      regex,
      paramNames,
      handler,
    });
  }

  public push(url: string) {
    try {
      // baseUrl이 없으면 자동으로 붙여줌
      const fullUrl = url.startsWith(this.baseUrl) ? url : this.baseUrl + (url.startsWith("/") ? url : "/" + url);
      const prevFullUrl = `${window.location.pathname}${window.location.search}`;

      // 히스토리 업데이트
      if (prevFullUrl !== fullUrl) {
        window.history.pushState(null, "", fullUrl);
      }

      this.currentRoute = this.findRoute(fullUrl);
      this.observer.notify();
    } catch (error) {
      console.error("라우터 네비게이션 오류:", error);
    }
  }

  public start(url?: string) {
    this.currentRoute = this.findRoute(url);
    this.observer.notify();
  }

  private findRoute(url = window.location.pathname) {
    const { pathname } = new URL(url, window.location.origin);

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
