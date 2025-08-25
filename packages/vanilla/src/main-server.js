import { Router } from "./lib/Router.js";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages/index.js";
import { BASE_URL } from "./constants.js";
import { mockGetProducts, mockGetCategories, mockGetProduct } from "./mocks/server.js";
import { productStore, PRODUCT_ACTIONS, initialProductState } from "./stores/index.js";

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

async function prefetchData(route, query, params) {
  try {
    if (route.path === "/") {
      // 홈페이지: 상품 목록과 카테고리 데이터 미리 로드
      const productsData = mockGetProducts(query);
      const categories = mockGetCategories();

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: productsData.products,
          categories,
          totalCount: productsData.pagination.total,
          loading: false,
          status: "done",
          error: null,
        },
      });

      return {
        products: productsData.products,
        categories,
        totalCount: productsData.pagination.total,
      };
    } else if (route.path === "/product/:id") {
      // 상품 상세 페이지: 해당 상품 데이터 미리 로드
      const productId = params.id;
      const product = mockGetProduct(productId);

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
        payload: product,
      });

      // 관련 상품도 로드
      let relatedProducts = [];
      if (product.category2) {
        try {
          const relatedData = mockGetProducts({
            category2: product.category2,
            limit: 20,
            page: 1,
          });
          relatedProducts = relatedData.products.filter((p) => p.productId !== productId);

          productStore.dispatch({
            type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
            payload: relatedProducts,
          });
        } catch (error) {
          console.error("관련 상품 로드 실패:", error);
        }
      }

      return {
        currentProduct: product,
        relatedProducts,
      };
    }
    return null;
  } catch (error) {
    console.error("데이터 프리페칭 오류:", error);
    return null;
  }
}

export async function render(url) {
  try {
    // Store 초기화
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: initialProductState,
    });

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
        initialData: null,
      };
    }

    const query = Router.parseQuery(new URL(url, "http://localhost").search);
    const params = route.params;

    global.router = {
      query,
      params,
      baseUrl: baseUrl,
    };

    // 서버에서 데이터 미리 로드
    const initialData = await prefetchData(route, query, params);

    let pageHtml;
    let pageTitle = "쇼핑몰";

    if (route.path === "/") {
      pageHtml = HomePage();
      pageTitle = "쇼핑몰 - 홈";
    } else if (route.path === "/product/:id") {
      pageHtml = ProductDetailPage();
      const productName = initialData?.currentProduct?.title || "상품";
      pageTitle = `${productName} - 쇼핑몰`;
    } else {
      pageHtml = NotFoundPage();
      pageTitle = "404 - Page Not Found";
    }

    return {
      html: pageHtml,
      head: `<title>${pageTitle}</title>`,
      initialData,
    };
  } catch (error) {
    console.error("SSR Error:", error);
    return {
      html: "<div>서버 렌더링 중 오류가 발생했습니다.</div>",
      head: "<title>오류 - 쇼핑몰</title>",
      initialData: null,
    };
  }
}
