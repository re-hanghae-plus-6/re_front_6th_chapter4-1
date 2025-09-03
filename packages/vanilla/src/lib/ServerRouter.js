import { HomePage, NotFoundPage, ProductDetailPage } from "../pages";

class ServerRouter {
  #route;
  #routes;

  constructor() {
    this.#routes = new Map();
    this.#route = null;
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

  // 동적 라우트를 정규식으로 변환하여 저장
  addRoute(path, handler) {
    const paramNames = [];

    // 경로 정규화: 끝의 슬래시 제거
    const normalizedPath = path.replace(/\/$/, "");

    const regexPath = normalizedPath
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

  // URL과 매칭되는 라우트 찾기
  findRoute(url) {
    for (const [routePath, route] of this.#routes) {
      const match = url.match(route.regex);

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
    this.#route = this.findRoute(pathname);
  }
}

// 서버 라우터 인스턴스 생성
const serverRouter = new ServerRouter();

// 라우트 등록
serverRouter.addRoute("/", HomePage);
serverRouter.addRoute("/product/:id", ProductDetailPage);
serverRouter.addRoute("/404", NotFoundPage);

export default serverRouter;
