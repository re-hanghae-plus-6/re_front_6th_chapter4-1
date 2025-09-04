/**
 * 서버용 라우터 클래스
 * 클라이언트 Router와 동일한 API를 제공하여 서버에서 라우팅을 처리
 */
import type { StringRecord } from "@hanghae-plus/lib";

export type RouteParams = StringRecord;
export type QueryParams = StringRecord;

type RouteRecord<THandler> = {
  regex: RegExp;
  paramNames: string[];
  handler: THandler;
};

type MatchedRoute<THandler> = RouteRecord<THandler> & {
  params: RouteParams;
  path: string;
};

export class ServerRouter<THandler = unknown> {
  #routes: Map<string, RouteRecord<THandler>>;
  #route: MatchedRoute<THandler> | null;
  #notFoundHandler: THandler | null;
  query?: QueryParams;

  constructor(routes: Record<string, THandler> | null = null) {
    this.#routes = new Map();
    this.#route = null;
    this.#notFoundHandler = null;
    if (routes) {
      this.addRoutes(routes);
    }
  }

  /**
   * routes 객체를 한 번에 등록
   * @param {Object} routes - 라우트 객체 { "/path": handler, "/product/:id": handler, "*": notFoundHandler }
   */
  addRoutes(routes: Record<string, THandler>) {
    for (const [path, handler] of Object.entries<THandler>(routes)) {
      this.addRoute(path, handler);
    }
  }

  /**
   * 라우트 등록
   * @param {string} path - 경로 패턴 (예: "/product/:id")
   * @param {Function} handler - 라우트 핸들러
   */
  addRoute(path: string, handler: THandler) {
    // * 경로 처리 (와일드카드)
    if (path === "*") {
      this.#notFoundHandler = handler;
      return;
    }

    const paramNames: string[] = [];

    const regexPath = path
      .replace(/:(\w+)/g, (_match, paramName) => {
        paramNames.push(paramName);
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

  /**
   * 내부: URL에 매칭되는 라우트 찾기
   * @param {string} url - 전체 URL 또는 pathname
   * @returns {Object|null}
   */
  #findRoute(url: string): MatchedRoute<THandler> | null {
    const { pathname } = new URL(url, `http://localhost`);

    for (const [routePath, route] of this.#routes) {
      const match = pathname.match(route.regex);
      if (match) {
        const params: RouteParams = {};
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

    if (this.#notFoundHandler) {
      return {
        handler: this.#notFoundHandler,
        params: {},
        path: "*",
      } as MatchedRoute<THandler>;
    }

    return null;
  }

  /**
   * URL에 매칭되는 라우트 찾기
   * @param {string} url - 매칭할 URL
   * @returns {Object|null} 매칭된 라우트와 매개변수, 또는 null
   */
  findRoute(url: string): MatchedRoute<THandler> | null {
    return this.#findRoute(url);
  }

  /**
   * 라우터 시작
   */
  start(pathname: string, query?: QueryParams): void {
    this.#route = this.#findRoute(pathname);
    this.query = query ?? {};
  }

  /** 현재 매칭된 라우트 반환 */
  get route(): MatchedRoute<THandler> | null {
    return this.#route;
  }

  /** 현재 라우트의 핸들러(target) 반환 */
  get target(): THandler | null {
    return this.#route?.handler || null;
  }

  /** 현재 라우트의 파라미터 반환 */
  get params(): RouteParams {
    return this.#route?.params || {};
  }
}
