import { getProduct, getProducts } from "../api/productApi";
import { HomePage, NotFoundPage, ProductDetailPage } from "../pages";
import { productStore } from "../stores";

class ServerRouter {
  constructor() {
    this.routes = new Map();
  }

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

    this.routes.set(path, { regex, paramNames, handler });
  }

  // URL과 매칭되는 라우트 찾기
  findRoute(url) {
    for (const [routePath, route] of this.routes) {
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
}

// 서버 라우터 인스턴스 생성
const serverRouter = new ServerRouter();

// 라우트 등록 + 데이터 프리페칭
serverRouter.addRoute("/", async () => {
  // 홈페이지 - 상품 목록
  const products = await getProducts({ limit: 20 });

  productStore.dispatch({ type: "SETUP", payload: products });

  return { page: HomePage };
});

serverRouter.addRoute("/product/:id", async (params) => {
  // 상품 상세 페이지
  const product = await getProduct(params.id);

  productStore.dispatch({ type: "SET_CURRENT_PRODUCT", payload: product });

  return { page: ProductDetailPage };
});

serverRouter.addRoute("/404", async () => {
  return { page: NotFoundPage };
});

export default serverRouter;
