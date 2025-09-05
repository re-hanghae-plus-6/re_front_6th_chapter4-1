import { getBaseUrl } from "./mocks/utils";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { productStore } from "./stores/productStore.js";
import { PRODUCT_ACTIONS } from "./stores/actionTypes.js";

class ServerRouter {
  #routes;
  // #route;
  #baseUrl;

  constructor(baseUrl = "") {
    this.#routes = new Map();
    // this.#route = null;
    this.#baseUrl = baseUrl.replace(/\/$/, "");
  }

  get baseUrl() {
    return this.#baseUrl;
  }

  get routes() {
    return this.#routes;
  }

  addRoute(path, handler) {
    // :id → (\\\\d+) 정규식 변환
    // paramNames 배열 저장
    const paramNames = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1)); // ':id' -> 'id'
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${regexPath}/?$`); // pathname만 비교하면 됨

    this.#routes.set(path, {
      regex,
      paramNames, // :id 값 반환
      handler, // 얘일 때 뭐실행?
    });
  }

  findRoute(url) {
    // full URL인 경우 pathname만 추출, 아니면 쿼리스트링만 제거
    let pathname;
    if (url.startsWith("http")) {
      pathname = new URL(url).pathname;
    } else {
      pathname = url.split("?")[0];
    }

    for (const [routePath, route] of this.#routes) {
      const match = pathname.match(route.regex);

      if (match) {
        // 매치된 파라미터들을 객체로 변환
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

  static getQueryString(url) {
    const query = url.split("?")[1] || "";
    return query;
  }

  static parseQueryString(url) {
    // "?"로 나눠서 뒷부분만 가져오기
    const query = url.split("?")[1] || "";
    const params = new URLSearchParams(query);
    const result = {};

    for (const [key, value] of params.entries()) {
      if (result[key]) {
        if (Array.isArray(result[key])) {
          result[key].push(value);
        } else {
          result[key] = [result[key], value];
        }
      } else {
        result[key] = value;
      }
    }

    return result;
  }
}

const isProd = process.env.NODE_ENV === "production";
const baseUrl = getBaseUrl(isProd);

async function prefetchData(route, { params, query }) {
  if (!route || route.path === "/") {
    const productsRes = await (await fetch(`${baseUrl}api/products${query ? `?${query}` : ""}`)).json();
    const categories = await (await fetch(`${baseUrl}api/categories`)).json();
    console.log("!?!?", productsRes, categories);
    return { products: productsRes.products, categories: categories, totalCount: productsRes.pagination.total };
  } else {
    const product = await fetch(`${baseUrl}api/products/${params.id}`).then((r) => r.json());

    // 관련 상품도 prefetch
    let relatedProducts = [];
    if (product.category2) {
      try {
        const relatedParams = new URLSearchParams({
          category2: product.category2,
          limit: "20",
          page: "1",
        });
        const relatedResponse = await fetch(`${baseUrl}api/products?${relatedParams}`).then((r) => r.json());
        // 현재 상품 제외
        relatedProducts = relatedResponse.products.filter((p) => p.productId !== params.id);
      } catch (error) {
        console.error("관련 상품 prefetch 실패:", error);
        relatedProducts = [];
      }
    }

    return { product, relatedProducts };
  }
}

// --- render.js ---

export async function render(url = "/") {
  const router = new ServerRouter("", url);
  router.addRoute("/", HomePage);
  router.addRoute("/product/:id", ProductDetailPage);

  const route = router.findRoute(url);
  const queryString = ServerRouter.getQueryString(url);
  const parsedQuery = ServerRouter.parseQueryString(url);
  console.log(queryString);
  if (!route) {
    const rendered = {
      html: NotFoundPage(),
      head: "",
    };
    return rendered;
  }

  const initialData = await prefetchData(route, { params: route ? route.params : {}, query: queryString });

  // SSR 환경에서만 임시로 store 초기화 (페이지 렌더링용)
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: {
      products: initialData.products || [],
      totalCount: initialData.totalCount || 0,
      categories: initialData.categories || {},
      currentProduct: initialData.product || null,
      relatedProducts: initialData.relatedProducts || [],
      loading: false,
      status: "done",
    },
  });

  let content = "";
  let head = `<script>window.__INITIAL_DATA__ = ${JSON.stringify(initialData)}</script>;`;
  if (route.handler) {
    if (route.handler === HomePage) {
      content = HomePage(parsedQuery);
      head += `<title>쇼핑몰 - 홈</title>`;
    } else if (route.handler === ProductDetailPage) {
      head += `<title>${initialData.product.title} - 쇼핑몰</title>`;
      content = ProductDetailPage(route.params.id);
    }
  } else {
    content = NotFoundPage();
  }

  const rendered = {
    html: content,
    head,
  };

  return rendered;
}
