export class ServerRouter {
  #routes = new Map();
  #baseUrl;
  #lastMatch = null;

  constructor(baseUrl = "") {
    this.#baseUrl = baseUrl.replace(/\/$/, "");
  }

  addRoute(path, handler) {
    const paramNames = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1));
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");
    const regex = new RegExp(`^${this.#baseUrl}${regexPath}$`);
    this.#routes.set(path, { regex, paramNames, handler });
  }

  match(url) {
    const { pathname, search } = new URL(url, "http://localhost");
    for (const [routePath, route] of this.#routes) {
      const match = pathname.match(route.regex);
      if (match) {
        const params = {};
        route.paramNames.forEach((name, idx) => {
          params[name] = match[idx + 1];
        });

        const matchResult = {
          ...route,
          params,
          path: routePath,
          query: ServerRouter.parseQuery(search),
        };

        this.#lastMatch = matchResult;
        return matchResult;
      }
    }
    this.#lastMatch = null;
    return null;
  }

  get params() {
    return this.#lastMatch?.params ?? {};
  }

  get query() {
    return this.#lastMatch?.query ?? {};
  }

  get path() {
    return this.#lastMatch?.path ?? "";
  }

  get target() {
    return this.#lastMatch?.handler;
  }

  static parseQuery(search = "") {
    const params = new URLSearchParams(search);
    const query = {};
    for (const [key, value] of params) {
      query[key] = value;
    }
    return query;
  }
}
