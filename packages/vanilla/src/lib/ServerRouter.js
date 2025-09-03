class ServerRouter {
  #route;
  #routes;
  #query;
  #pathname;

  constructor() {
    this.#routes = new Map();
    this.#route = null;
    this.#query = {};
    this.#pathname = "/";
  }

  get params() {
    return this.#route?.params ?? {};
  }

  get target() {
    return this.#route?.handler;
  }

  get query() {
    return this.#query;
  }

  get pathname() {
    return this.#pathname;
  }

  set query(newQuery) {
    this.#query = { ...newQuery };
    // 새로운 URL로 라우팅을 다시 실행
    const newUrl = ServerRouter.getUrl(newQuery, this.#pathname);
    this.start(newUrl);
  }

  // 동적 라우트를 정규식으로 변환하여 저장
  addRoute(path, handler) {
    const paramNames = [];

    // 경로 정규화: 끝의 슬래시 제거
    const normalizedPath = path.replace(/\/$/, "");

    const regexPath = normalizedPath
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1)); // ':id' -> 'id'
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

  // URL과 매칭되는 라우트 찾기
  findRoute(path) {
    for (const [routePath, route] of this.#routes) {
      const match = path.replace(/\/$/, "").match(route.regex);

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

  start(url) {
    const [pathname, search] = url.split("?");
    this.#pathname = pathname;
    this.#query = ServerRouter.parseQuery(search);

    this.#route = this.findRoute(pathname);
  }

  static parseQuery(search) {
    if (!search) return {};

    try {
      const params = new URLSearchParams(search);
      const query = {};
      for (const [key, value] of params) {
        query[key] = decodeURIComponent(value);
      }
      return query;
    } catch (error) {
      console.warn("Failed to parse query:", search, error);
      return {};
    }
  }

  // URL 생성 메서드 추가 (Router.js와 동일한 로직)
  static getUrl(newQuery, currentPathname = "/") {
    const currentQuery = ServerRouter.parseQuery();
    const updatedQuery = { ...currentQuery, ...newQuery };

    // 빈 값들 제거
    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = ServerRouter.stringifyQuery(updatedQuery);
    return `${currentPathname}${queryString ? `?${queryString}` : ""}`;
  }

  // 쿼리 문자열 변환 메서드 추가
  static stringifyQuery(query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
    return params.toString();
  }

  // 데이터 프리페칭 메서드 추가
  async prefetch(routeParams) {
    if (!this.#route?.handler?.prefetch) {
      return {};
    }

    try {
      return await this.#route.handler.prefetch(routeParams);
    } catch (error) {
      console.error("Prefetch error:", error);
      return {};
    }
  }
}

// 서버 라우터 인스턴스 생성
const serverRouter = new ServerRouter();

export default ServerRouter;
export { serverRouter };
