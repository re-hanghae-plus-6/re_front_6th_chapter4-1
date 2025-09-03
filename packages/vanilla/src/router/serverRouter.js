/**
 * 서버에서 사용하는 라우터 클래스
 * 클라이언트 Router와 유사한 인터페이스를 제공하지만 서버 환경에 최적화
 */
export class ServerRouter {
  #routes;
  #baseUrl;

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#baseUrl = baseUrl.replace(/\/$/, "");
  }

  /**
   * 라우트 등록
   * @param {string} path - 경로 패턴 (예: "/product/:id")
   * @param {Function} handler - 라우트 핸들러
   */
  addRoute(path, handler) {
    // 경로 패턴을 정규식으로 변환 (클라이언트 Router와 동일한 로직)
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
      path,
    });
  }

  findRoute(url) {
    const urlObj = new URL(url, "http://localhost");
    const pathname = urlObj.pathname;

    for (const [, route] of this.#routes) {
      const match = pathname.match(route.regex);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        return {
          ...route,
          params,
          query: this.parseQuery(urlObj.search),
        };
      }
    }
    return null;
  }

  /**
   * 쿼리 파라미터를 객체로 파싱
   * @param {string} search - URL의 search 부분
   * @returns {Object} 파싱된 쿼리 객체
   */
  parseQuery(search = "") {
    const params = new URLSearchParams(search);
    const query = {};
    for (const [key, value] of params) {
      query[key] = value;
    }
    return query;
  }
}
