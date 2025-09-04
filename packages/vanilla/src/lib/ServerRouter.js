/**
 * 서버사이드 렌더링용 라우터
 * 브라우저 API에 의존하지 않고 URL 문자열만으로 동작
 */
export class ServerRouter {
  #routes;
  #url;
  #route;
  #baseUrl;

  constructor(urlString, baseUrl = "") {
    this.#routes = new Map();
    this.#url = new URL(urlString, "http://localhost");
    this.#baseUrl = baseUrl.replace(/\/$/, "");
    this.#route = null;
  }

  get baseUrl() {
    return this.#baseUrl;
  }

  get query() {
    return ServerRouter.parseQuery(this.#url.search);
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

  get pathname() {
    return this.#url.pathname;
  }

  /**
   * 라우트 등록 (클라이언트 Router와 동일한 로직)
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

  /**
   * 현재 URL에 맞는 라우트 찾기
   */
  findRoute(pathname = this.#url.pathname) {
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
   * 라우터 시작 - 현재 URL에 맞는 라우트 찾기
   */
  start() {
    this.#route = this.findRoute();
    return this.#route;
  }

  /**
   * 쿼리 파라미터를 객체로 파싱
   * @param {string} search - 쿼리 문자열
   * @returns {Object} 파싱된 쿼리 객체
   */
  static parseQuery(search = "") {
    const params = new URLSearchParams(search);
    const query = {};
    for (const [key, value] of params) {
      query[key] = value;
    }
    return query;
  }

  /**
   * 객체를 쿼리 문자열로 변환
   * @param {Object} query - 쿼리 객체
   * @returns {string} 쿼리 문자열
   */
  static stringifyQuery(query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
    return params.toString();
  }
}
