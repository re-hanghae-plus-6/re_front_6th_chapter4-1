/**
 * 간단한 SPA 라우터
 */

export class ServerRouter {
  #routes;
  #route;

  constructor(routerMatches) {
    this.#routes = new Map();
    this.#route = null;

    Object.entries(routerMatches).forEach(([pathname, page]) => {
      this.addRoute(pathname, page);
    });
  }

  get params() {
    return this.#route?.params ?? {};
  }

  get target() {
    return this.#route?.handler;
  }

  get query() {
    return {};
  }

  set query(_) {}

  /**
   * 라우트 등록
   * @param {string} path
   * @param {Function} handler
   */
  addRoute(path, handler) {
    const paramNames = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1));
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

  #findRoute(pathname) {
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

  start(pathname) {
    this.#route = this.#findRoute(pathname);
  }
}
