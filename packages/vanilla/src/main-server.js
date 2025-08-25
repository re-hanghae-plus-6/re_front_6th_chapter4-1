import { Router } from "./lib/Router.js";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages/index.js";
import { BASE_URL } from "./constants.js";

class ServerRouter {
  constructor(baseUrl = "") {
    this.routes = new Map();
    this.baseUrl = baseUrl.replace(/\/$/, "");
    this.initRoutes();
  }

  initRoutes() {
    this.addRoute("/", HomePage);
    this.addRoute("/product/:id", ProductDetailPage);
    // 404는 마지막에 추가하고, 더 구체적인 패턴으로 변경
    this.addRoute("/.*", NotFoundPage);
  }

  addRoute(path, handler) {
    const paramNames = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1));
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${this.baseUrl}${regexPath}$`);

    this.routes.set(path, {
      regex,
      paramNames,
      handler,
    });
  }

  findRoute(url) {
    const pathname = new URL(url, "http://localhost").pathname;

    // 명시적 라우트들을 먼저 확인 (404 패턴 제외)
    const specificRoutes = ["/", "/product/:id"];

    for (const routePath of specificRoutes) {
      if (this.routes.has(routePath)) {
        const route = this.routes.get(routePath);
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
    }

    // 매칭되는 라우트가 없으면 404
    return null;
  }
}

export async function render(url) {
  try {
    // 개발 환경에서는 BASE_URL을 빈 문자열로 사용
    const baseUrl = process.env.NODE_ENV === "production" ? BASE_URL : "";
    const serverRouter = new ServerRouter(baseUrl);
    const route = serverRouter.findRoute(url);

    console.log("Requested URL:", url);
    console.log("Base URL:", baseUrl);
    console.log("Found route:", route);

    if (!route) {
      return {
        html: NotFoundPage(),
        head: "<title>404 - Page Not Found</title>",
      };
    }

    global.router = {
      query: Router.parseQuery(new URL(url, "http://localhost").search),
      params: route.params,
      baseUrl: baseUrl,
    };

    let pageHtml;
    let pageTitle = "쇼핑몰";

    if (route.path === "/") {
      pageHtml = HomePage();
      pageTitle = "쇼핑몰 - 홈";
    } else if (route.path === "/product/:id") {
      pageHtml = ProductDetailPage();
      pageTitle = `상품 상세 - 쇼핑몰`;
    } else {
      pageHtml = NotFoundPage();
      pageTitle = "404 - Page Not Found";
    }

    return {
      html: pageHtml,
      head: `<title>${pageTitle}</title>`,
    };
  } catch (error) {
    console.error("SSR Error:", error);
    return {
      html: "<div>서버 렌더링 중 오류가 발생했습니다.</div>",
      head: "<title>오류 - 쇼핑몰</title>",
    };
  }
}
