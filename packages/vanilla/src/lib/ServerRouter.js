/**
 * 서버용 라우터 클래스
 * 클라이언트 Router와 동일한 API를 제공하여 서버에서 라우팅을 처리
 */
export class ServerRouter {
  #routes;
  #baseUrl;
  #route;

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#baseUrl = baseUrl.replace(/\/$/, "");
    this.#route = null;
  }

  get baseUrl() {
    return this.#baseUrl;
  }

  /**
   * 라우트 등록
   * @param {string} path - 경로 패턴 (예: "/product/:id")
   * @param {Function} handler - 라우트 핸들러
   */
  addRoute(path, handler) {
    const paramNames = [];
    let regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1));
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    if (path === "*") {
      regexPath = ".*";
    }

    const regex = new RegExp(`^${this.#baseUrl}${regexPath}$`);

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
  #findRoute(url) {
    const { pathname } = new URL(url, `http://localhost${this.#baseUrl}`);

    for (const [routePath, route] of this.#routes) {
      const match = pathname.match(route.regex);
      if (match) {
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
   * URL에 매칭되는 라우트 찾기
   * @param {string} url - 매칭할 URL
   * @returns {Object|null} 매칭된 라우트와 매개변수, 또는 null
   */
  findRoute(url) {
    return this.#findRoute(url);
  }

  /**
   * 라우터 시작
   */
  start(pathname) {
    this.#route = this.#findRoute(pathname);
  }

  /** 현재 매칭된 라우트 반환 */
  get route() {
    return this.#route;
  }
}
