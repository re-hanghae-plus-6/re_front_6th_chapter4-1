export class ServerRouter {
  static parseQuery = (search = "") => {
    const params = new URLSearchParams(search);
    const query = {};

    for (const [key, value] of params) {
      query[key] = value;
    }

    return query;
  };

  static stringifyQuery = (query) => {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }

    return params.toString();
  };

  static getUrl = (newQuery, baseUrl = "") => {
    const currentQuery = ServerRouter.parseQuery();
    const updatedQuery = { ...currentQuery, ...newQuery };

    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = ServerRouter.stringifyQuery(updatedQuery);

    return `${baseUrl}${queryString ? `?${queryString}` : ""}`;
  };

  #routes;
  #route;

  constructor() {
    this.#routes = new Map();
    this.#route = null;
  }

  get query() {
    return {};
  }

  set query(newQuery) {
    // 서버사이드에서는 쿼리 설정을 무시
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

  addRoute(path, handler) {
    const paramNames = [];
    let regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1));
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    if (path === "*" || path === ".*") {
      regexPath = ".*";
    } else if (!path.endsWith("/") && !path.includes("*")) {
      regexPath += "\\/?";
    }

    const regex = new RegExp(`^${regexPath}$`);

    this.#routes.set(path, {
      regex,
      paramNames,
      handler,
    });
  }

  push(url) {
    this.#route = this.#findRoute(url);
  }

  start() {
    this.#route = this.#findRoute();
  }

  #findRoute(url = "/") {
    const { pathname } = new URL(url, "http://localhost/");

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
}
