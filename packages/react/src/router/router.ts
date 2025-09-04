/**
 * 간단한 SPA 라우터
 */
import { createObserver } from "@hanghae-plus/lib";
import type { RouteHandler, RouteInfo, MatchedRoute, ClientRouter, GetServerSideProps } from "./types";

export class Router implements ClientRouter {
  #routes: Map<string, RouteInfo>;
  #route: MatchedRoute | null;
  #observer = createObserver();
  #baseUrl: string;
  #cachedQuery: Record<string, string> | null = null;
  #lastSearch: string | null = null;

  constructor(baseUrl: string = "") {
    this.#routes = new Map();
    this.#route = null;
    this.#baseUrl = baseUrl.replace(/\/$/, "");

    // 서버 환경에서는 window가 없으므로 이벤트 리스너를 추가하지 않음
    if (typeof window !== "undefined") {
      window.addEventListener("popstate", () => {
        // 캐시 무효화
        this.#cachedQuery = null;
        this.#lastSearch = null;

        this.#route = this.#findRoute();
        this.#observer.notify();
      });
    }
  }

  get baseUrl(): string {
    return this.#baseUrl;
  }

  get query(): Record<string, string> {
    const currentSearch = typeof window !== "undefined" ? window.location.search : "";

    // 캐시된 결과가 있고 search가 변경되지 않았다면 캐시된 결과 반환
    if (this.#cachedQuery && this.#lastSearch === currentSearch) {
      return this.#cachedQuery;
    }

    // 새로운 query 파싱 및 캐싱
    this.#cachedQuery = Router.parseQuery(currentSearch);
    this.#lastSearch = currentSearch;

    return this.#cachedQuery;
  }

  set query(newQuery: Record<string, string | null | undefined>) {
    const newUrl = Router.getUrl(newQuery, this.#baseUrl);
    this.push(newUrl);
  }

  get params(): Record<string, string> {
    return this.#route?.params ?? {};
  }

  get route(): MatchedRoute | null {
    return this.#route;
  }

  get target(): RouteHandler | undefined {
    return this.#route?.handler;
  }

  subscribe(fn: () => void): () => void {
    return this.#observer.subscribe(fn);
  }

  /**
   * 라우트 등록
   * @param path - 경로 패턴 (예: "/product/:id")
   * @param handler - 라우트 핸들러
   * @param getServerSideProps - 서버사이드 props 함수 (클라이언트에서는 무시됨)
   */
  addRoute(path: string, handler: RouteHandler, getServerSideProps?: GetServerSideProps): void {
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
      getServerSideProps,
    });
  }

  #findRoute(url: string = typeof window !== "undefined" ? window.location.pathname : "/"): MatchedRoute | null {
    const { pathname } = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost");
    for (const [routePath, route] of this.#routes) {
      const match = pathname.match(route.regex);
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
   * @param url - 이동할 경로
   */
  push(url: string): void {
    try {
      // 서버 환경에서는 네비게이션을 수행하지 않음
      if (typeof window === "undefined") {
        return;
      }

      // baseUrl이 없으면 자동으로 붙여줌
      const fullUrl = url.startsWith(this.#baseUrl) ? url : this.#baseUrl + (url.startsWith("/") ? url : "/" + url);

      const prevFullUrl = `${window.location.pathname}${window.location.search}`;

      // 히스토리 업데이트
      if (prevFullUrl !== fullUrl) {
        window.history.pushState(null, "", fullUrl);
      }

      // 캐시 무효화
      this.#cachedQuery = null;
      this.#lastSearch = null;

      this.#route = this.#findRoute(fullUrl);
      this.#observer.notify();
    } catch (error) {
      console.error("라우터 네비게이션 오류:", error);
    }
  }

  /**
   * 라우터 시작
   */
  start(): void {
    this.#route = this.#findRoute();
    this.#observer.notify();
  }

  /**
   * 쿼리 파라미터를 객체로 파싱
   * @param search - location.search 또는 쿼리 문자열
   * @returns 파싱된 쿼리 객체
   */
  static parseQuery = (
    search: string = typeof window !== "undefined" ? window.location.search : "",
  ): Record<string, string> => {
    const params = new URLSearchParams(search);
    const query: Record<string, string> = {};
    for (const [key, value] of params) {
      query[key] = value;
    }
    return query;
  };

  /**
   * 객체를 쿼리 문자열로 변환
   * @param query - 쿼리 객체
   * @returns 쿼리 문자열
   */
  static stringifyQuery = (query: Record<string, unknown>): string => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
    return params.toString();
  };

  static getUrl = (newQuery: Record<string, unknown>, baseUrl: string = ""): string => {
    const currentQuery = Router.parseQuery();
    const updatedQuery = { ...currentQuery, ...newQuery };

    // 빈 값들 제거
    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = Router.stringifyQuery(updatedQuery);
    const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
    return `${baseUrl}${pathname.replace(baseUrl, "")}${queryString ? `?${queryString}` : ""}`;
  };
}
