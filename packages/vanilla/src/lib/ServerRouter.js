/**
 * 서버 사이드 라우터
 * 클라이언트 Router와 유사한 API를 제공하지만 서버 환경에 최적화됨
 */
export class ServerRouter {
  #routes;
  #route;
  #baseUrl;

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#route = null;
    this.#baseUrl = baseUrl.replace(/\/$/, "");
  }

  get baseUrl() {
    return this.#baseUrl;
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

  /**
   * 라우트 등록
   * @param {string} path - 경로 패턴 (예: "/product/:id")
   * @param {Function} handler - 라우트 핸들러
   */
  addRoute(path, handler) {
    const paramNames = [];
    // 앞의 /를 제거하고 정규식 생성 (서버에서 base를 제거한 URL과 매칭하기 위해)
    const pathWithoutSlash = path.startsWith("/") ? path.slice(1) : path;
    let regexPath = pathWithoutSlash
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1));
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    // 홈페이지 라우트 (/)의 경우 빈 문자열과 슬래시 모두 매칭하도록 수정
    if (path === "/") {
      regexPath = "(?:^$|^\\/$)";
    }

    const regex = new RegExp(`^${regexPath}$`);

    console.log(`서버 라우트 등록: ${path} -> ${regex}`);

    this.#routes.set(path, {
      regex,
      paramNames,
      handler,
    });
  }

  /**
   * 라우트 매칭
   * @param {string} url - 매칭할 URL
   * @returns {Object|null} 매칭된 라우트 정보
   */
  findRoute(url) {
    const pathname = url.split("?")[0]; // 쿼리 파라미터 제거
    const normalizedPath = pathname === "" ? "/" : pathname; // 빈 문자열을 "/"로 정규화

    console.log("서버 라우트 찾기:", normalizedPath);
    console.log("등록된 서버 라우트들:", Array.from(this.#routes.keys()));

    // 구체적인 라우트부터 먼저 확인 (.* 라우트는 마지막에)
    const routeOrder = ["/", "/product/:id/", ".*"];

    for (const routePath of routeOrder) {
      const route = this.#routes.get(routePath);
      if (route) {
        const match = normalizedPath.match(route.regex);
        console.log(`라우트 ${routePath} 매칭 시도:`, match);
        if (match) {
          const params = {};
          route.paramNames.forEach((name, index) => {
            params[name] = match[index + 1];
          });

          console.log("매칭된 라우트:", routePath, "파라미터:", params);
          return {
            ...route,
            params,
            path: routePath,
          };
        }
      }
    }
    return null;
  }

  /**
   * 라우터 시작 - URL을 기반으로 라우트 매칭
   * @param {string} pathname - 현재 경로
   * @param {Object} query - 쿼리 파라미터
   */
  start(pathname, query = {}) {
    this.#route = this.findRoute(pathname);
    console.log("서버 라우터 시작:", { pathname, query, route: this.#route });
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
}
