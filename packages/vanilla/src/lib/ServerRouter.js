export class ServerRouter {
  constructor(routerMatches = {}) {
    this.routes = new Map();

    // 생성자로 라우트를 한 번에 등록
    Object.entries(routerMatches).forEach(([pathname, page]) => {
      this.addRoute(pathname, page);
    });
  }

  addRoute(path, handler) {
    const paramNames = [];

    // "/product/:id" → "/product/([^/]+)"
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1)); // ':id' → 'id'
        return "([^/]+)"; // 파라미터 부분을 정규식으로 변환
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${regexPath}$`);

    this.routes.set(path, {
      regex,
      paramNames,
      handler,
    });
  }

  // URL을 매칭하여 해당하는 라우트 정보 반환
  match(url) {
    // URL 객체로 파싱 (pathname과 search 분리)
    const urlObj = new URL(url, "http://localhost");
    const { pathname, search } = urlObj;

    // 등록된 라우트들과 매칭 시도
    for (const [routePath, route] of this.routes) {
      const match = pathname.match(route.regex);

      if (match) {
        // 매칭된 파라미터들을 객체로 변환
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        // 쿼리 파라미터 파싱
        const query = this.parseQuery(search);

        return {
          handler: route.handler,
          params,
          query,
          path: routePath,
          pathname,
          search,
        };
      }
    }

    return null; // 매칭되는 라우트 없음
  }

  // 쿼리 문자열을 객체로 파싱
  parseQuery(search = "") {
    const params = new URLSearchParams(search);
    const query = {};

    for (const [key, value] of params) {
      query[key] = value;
    }

    return query;
  }
}
