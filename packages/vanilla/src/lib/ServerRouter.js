/**
 * 서버사이드 라우터
 */
import { BaseRouter } from "./BaseRouter.js";

export class ServerRouter extends BaseRouter {
  #currentUrl = "/";
  #origin = "http://localhost";
  #routes = new Map();

  constructor(baseUrl = "") {
    super(baseUrl);
  }

  get query() {
    const url = new URL(this.#currentUrl, this.#origin);
    return BaseRouter.parseQuery(url.search);
  }

  set query(newQuery) {
    const newUrl = BaseRouter.getUrl(newQuery, this.baseUrl, this.#currentUrl);
    this.setUrl(newUrl, this.#origin);
  }

  getCurrentUrl() {
    return this.#currentUrl;
  }

  getOrigin() {
    return this.#origin;
  }

  /**
   * 서버 URL 설정
   * @param {string} url - 요청 URL
   * @param {string} [origin] - 서버 origin (선택적)
   */
  setUrl(url, origin = "http://localhost") {
    this.#currentUrl = url;
    this.#origin = origin;
    this.updateRoute(this.getCurrentUrl());
  }

  /**
   * 서버사이드에서는 네비게이션 불가
   */
  push() {
    throw new Error("Navigation is not supported in server-side routing");
  }

  /**
   * 라우터 시작
   */
  start(url, query = {}) {
    this.setUrl(url, this.#origin);
    this.query = query;
  }

  /**
   * 라우트 등록
   */
  addRoute(path, handler) {
    this.#routes.set(path, handler);
  }

  /**
   * 현재 라우트 찾기
   */
  findRoute(url) {
    const { pathname } = new URL(url, this.#origin);

    // 정확한 매칭 먼저 시도
    if (this.#routes.has(pathname)) {
      return {
        path: pathname,
        handler: this.#routes.get(pathname),
        params: {},
      };
    }

    // 동적 라우트 매칭
    for (const [routePath, handler] of this.#routes) {
      if (routePath.includes(":")) {
        const paramNames = [];
        const regexPath = routePath
          .replace(/:\w+/g, (match) => {
            paramNames.push(match.slice(1));
            return "([^/]+)";
          })
          .replace(/\//g, "\\/");

        const regex = new RegExp(`^${regexPath}$`);
        const match = pathname.match(regex);

        if (match) {
          const params = {};
          paramNames.forEach((name, index) => {
            params[name] = match[index + 1];
          });

          return {
            path: routePath,
            handler,
            params,
          };
        }
      }
    }

    // 와일드카드 매칭
    if (this.#routes.has(".*")) {
      return {
        path: ".*",
        handler: this.#routes.get(".*"),
        params: {},
      };
    }

    return null;
  }

  /**
   * 현재 라우트 정보 가져오기
   */
  get route() {
    return this.findRoute(this.#currentUrl);
  }

  /**
   * 현재 핸들러 가져오기
   */
  get target() {
    const route = this.route;
    return route ? route.handler : null;
  }
}
