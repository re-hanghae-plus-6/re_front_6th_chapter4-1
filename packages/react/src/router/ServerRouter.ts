import type { JSX } from "react";

interface PageComponent {
  (): JSX.Element;
  prefetch(params: RouteParams): Promise<object>;
  meta(data: object): string;
}

interface Route {
  regex: RegExp;
  paramNames: string[];
  component: PageComponent;
  params?: Record<string, string>;
}

export interface RouteParams {
  pathname: string;
  query: Record<string, string>;
  params: Record<string, string>;
}

export class ServerRouter {
  #routes: Map<string, Route>;
  #route: Route | null;
  #baseUrl: string;
  #query: Record<string, string>;
  #pathname: string;

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#route = null;
    this.#baseUrl = baseUrl.replace(/\/$/, "");
    this.#query = {};
    this.#pathname = "/";
  }

  get pathname() {
    return this.#pathname;
  }

  get baseUrl() {
    return this.#baseUrl;
  }

  get query() {
    return this.#query;
  }

  set query(newQuery: Record<string, string>) {
    this.#query = { ...newQuery };

    const newUrl = ServerRouter.getUrl(newQuery, this.#pathname);
    this.push(newUrl);
  }

  get params() {
    return this.#route?.params ?? {};
  }

  get route() {
    return this.#route;
  }

  get target() {
    return this.#route?.component;
  }

  /**
   * 라우트 등록
   * @param {string} path - 경로 패턴 (예: "/product/:id")
   * @param {PageComponent} component - 라우트 컴포넌트
   */
  addRoute(path: string, component: PageComponent) {
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
      component,
    });
  }

  #findRoute(pathname: string) {
    let normalizedPathname = pathname;
    if (!normalizedPathname.startsWith("/")) {
      normalizedPathname = "/" + normalizedPathname;
    }

    for (const [routePath, route] of this.#routes) {
      const match = normalizedPathname.match(route.regex);

      if (match) {
        // 매치된 파라미터들을 객체로 변환
        const params: Record<string, string> = {};

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

  /**
   * 네비게이션 실행
   * @param {string} url - 이동할 경로
   */
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
    } catch (error) {
      console.error("라우터 네비게이션 오류:", error);
    }
  }

  /**
   * 라우터 시작
   */
  start(url: string) {
    const [pathname, search] = url.split("?");
    this.#pathname = pathname;
    this.#query = ServerRouter.parseQuery(search);

    this.#route = this.#findRoute(pathname);
  }

  /**
   * 쿼리 파라미터를 객체로 파싱
   * @param {string} search - location.search 또는 쿼리 문자열
   * @returns {Object} 파싱된 쿼리 객체
   */
  static parseQuery = (search?: string): Record<string, string> => {
    if (!search) return {};

    const params = new URLSearchParams(search);
    const query: Record<string, string> = {};

    for (const [key, value] of params) {
      query[key] = decodeURIComponent(value);
    }

    return query;
  };

  /**
   * 객체를 쿼리 문자열로 변환
   * @param {Object} query - 쿼리 객체
   * @returns {string} 쿼리 문자열
   */
  static stringifyQuery = (query: Record<string, string>): string => {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
    return params.toString();
  };

  static getUrl = (newQuery: Record<string, string>, currentPathname = "/"): string => {
    const currentQuery = ServerRouter.parseQuery();
    const updatedQuery = { ...currentQuery, ...newQuery };

    // 빈 값들 제거
    Object.keys(updatedQuery).forEach((key: string) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = ServerRouter.stringifyQuery(updatedQuery);
    return `${currentPathname}${queryString ? `?${queryString}` : ""}`;
  };

  async prefetch(routeParams: { pathname: string; query: Record<string, string>; params: Record<string, string> }) {
    if (!this.#route?.component?.prefetch) {
      return {};
    }

    try {
      return await this.#route.component.prefetch(routeParams);
    } catch (error) {
      console.error("Prefetch error:", error);
      return {};
    }
  }
}
