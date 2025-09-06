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

  get query() {
    return ServerRouter.parseQuery(window.location.search);
  }

  set query(newQuery) {
    const newUrl = ServerRouter.getUrl(newQuery, this.#baseUrl);
    this.push(newUrl);
  }

  get params() {
    return this.#route?.params ?? {};
  }

  get route() {
    return this.#route;
  }

  setParams(params) {
    if (!this.#route) {
      this.#route = {};
    }
    this.#route.params = params;
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

  findRoute(url) {
    const { pathname } = new URL(url, "http://localhost");

    for (const [routePath, route] of this.#routes) {
      // 원본 pathname으로 먼저 시도
      let match = pathname.match(route.regex);

      // 매치되지 않으면 trailing slash 정규화 후 재시도
      if (!match) {
        const normalizedPathname = pathname === "/" ? pathname : pathname.replace(/\/$/, "");
        match = normalizedPathname.match(route.regex);
      }

      // 매치되지 않으면 trailing slash 추가 후 재시도
      if (!match && !pathname.endsWith("/")) {
        const withTrailingSlash = pathname + "/";
        match = withTrailingSlash.match(route.regex);
      }

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

    console.log("❌ No route matched for:", url);
    return null;
  }

  static getUrl = (newQuery, baseUrl = "") => {
    const currentQuery = ServerRouter.parseQuery();
    const updatedQuery = { ...currentQuery, ...newQuery };

    // 빈 값들 제거
    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = ServerRouter.stringifyQuery(updatedQuery);
    return `${baseUrl}${window.location.pathname.replace(baseUrl, "")}${queryString ? `?${queryString}` : ""}`;
  };
}
