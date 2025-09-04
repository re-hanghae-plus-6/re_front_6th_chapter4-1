/**
 * 간단한 SPA 라우터 (서버/클라이언트 환경 지원)
 */
import { createObserver } from "./createObserver.js";

export class Router {
  #routes;
  #route;
  #observer = createObserver();
  #baseUrl;
  #pathname;
  #search;

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#route = null;
    this.#baseUrl = baseUrl.replace(/\/$/, "");
    this.#pathname = null;
    this.#search = "";

    if (typeof window !== "undefined") {
      window.addEventListener("popstate", () => {
        this.#route = this.#findRoute();
        this.#observer.notify();
      });
    }
  }

  get baseUrl() {
    return this.#baseUrl;
  }

  get query() {
    const search = this.#search !== null ? this.#search : typeof window !== "undefined" ? window.location.search : "";
    return Router.parseQuery(search);
  }

  set query(newQuery) {
    const pathname =
      this.#pathname !== null ? this.#pathname : typeof window !== "undefined" ? window.location.pathname : "/";
    const search = this.#search !== null ? this.#search : typeof window !== "undefined" ? window.location.search : "";
    const newUrl = Router.getUrl(newQuery, this.#baseUrl, pathname, search);
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

  subscribe(fn) {
    this.#observer.subscribe(fn);
  }

  /**
   * 라우트 등록
   * @param {string} path - 경로 패턴 (예: "/product/:id")
   * @param {Function} handler - 라우트 핸들러
   */
  addRoute(path, handler) {
    // 경로 패턴을 정규식으로 변환
    const paramNames = [];
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

  #findRoute(url) {
    let pathname;
    if (url) {
      if (typeof window !== "undefined") {
        const { pathname: urlPathname } = new URL(url, window.location.origin);
        pathname = urlPathname;
      } else {
        const { pathname: urlPathname } = new URL(url, "http://localhost");
        pathname = urlPathname;
      }
    } else {
      pathname =
        this.#pathname !== null ? this.#pathname : typeof window !== "undefined" ? window.location.pathname : "/";
    }

    for (const [routePath, route] of this.#routes) {
      const match = pathname.match(route.regex);
      if (match) {
        // 매치된 파라미터들을 객체로 변환
        const params = {};
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
  push(url) {
    try {
      // baseUrl이 없으면 자동으로 붙여줌
      let fullUrl = url.startsWith(this.#baseUrl) ? url : this.#baseUrl + (url.startsWith("/") ? url : "/" + url);

      if (typeof window !== "undefined") {
        const prevFullUrl = `${window.location.pathname}${window.location.search}`;

        // 히스토리 업데이트
        if (prevFullUrl !== fullUrl) {
          window.history.pushState(null, "", fullUrl);
        }
      } else {
        // 서버 환경에서는 내부 상태 업데이트
        const newURL = new URL(fullUrl, "http://localhost");
        this.#pathname = newURL.pathname;
        this.#search = newURL.search;
      }

      this.#route = this.#findRoute(fullUrl);
      this.#observer.notify();
    } catch (error) {
      console.error("라우터 네비게이션 오류:", error);
    }
  }

  /**
   * 라우터 시작
   * @param {string} pathname - 서버 환경에서의 초기 경로
   * @param {string} search - 서버 환경에서의 초기 쿼리 문자열
   */
  start(pathname, search) {
    if (typeof window === "undefined") {
      // 서버 환경
      this.#pathname = pathname || "/";
      this.#search = search || "";
    }
    this.#route = this.#findRoute();
    this.#observer.notify();
  }

  /**
   * 쿼리 파라미터를 객체로 파싱
   * @param {string} search - location.search 또는 쿼리 문자열
   * @returns {Object} 파싱된 쿼리 객체
   */
  static parseQuery = (search) => {
    const params = new URLSearchParams(search);
    const query = {};
    for (const [key, value] of params) {
      query[key] = value;
    }
    return query;
  };

  /**
   * 객체를 쿼리 문자열로 변환
   * @param {Object} query - 쿼리 객체
   * @returns {string} 쿼리 문자열
   */
  static stringifyQuery = (query) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
    return params.toString();
  };

  static getUrl = (newQuery, baseUrl = "", pathname, search) => {
    const currentQuery = Router.parseQuery(search);
    const updatedQuery = { ...currentQuery, ...newQuery };

    // 빈 값들 제거
    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = Router.stringifyQuery(updatedQuery);
    return `${baseUrl}${pathname.replace(baseUrl, "")}${queryString ? `?${queryString}` : ""}`;
  };
}
