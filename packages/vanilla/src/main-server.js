import { PageWrapper } from "./pages/PageWrapper.js";
import { SearchBar, ProductList } from "./components";
import { ServerRouter } from "./lib/ServerRouter.js";

const serverRouter = new ServerRouter();

// 라우트 등록: 홈, 상품상세, 404
serverRouter.addRoute("/", () => ({ title: "홈" }));
serverRouter.addRoute("/product/:id", (params) => ({ title: `상품 ${params.id}` }));
serverRouter.addRoute("*", () => ({ title: "오류" }));

let store = { products: [], currentProduct: null, categories: {} };

// 라우트별 데이터 프리페칭
async function prefetchData(route, params) {
  if (route.path === "/") {
    // mockGetProducts + mockGetCategories
    const products = [
      { id: 1, name: "무선 블루투스 이어폰", price: 89000 },
      { id: 2, name: "스마트워치", price: 299000 },
      { id: 3, name: "노트북 스탠드", price: 45000 },
    ];

    // productStore.dispatch(SETUP) 대신 직접 할당
    store.products = products;
    store.categories = { electronics: "전자제품", accessories: "액세서리" };

    return { products, categories: store.categories };
  } else if (route.path === "/product/:id") {
    // mockGetProduct(params.id)
    const product = store.products.find((p) => p.id === parseInt(params.id)) || {
      id: params.id,
      name: "상품명",
      price: 0,
    };
    // productStore.dispatch(SET_CURRENT_PRODUCT) 대신 직접 할당
    store.currentProduct = product;

    return { currentProduct: product };
  }

  return {};
}

/**
 * @param {string} pathname
 * @param {Record<string, any>} query
 */
export async function render(pathname, query = {}) {
  // 0. URL 정보 준비 완료 (서버에서 전달된 pathname, query 사용)

  // 1. Store 초기화
  store = { products: [], currentProduct: null, categories: {} };

  // 2. 라우트 매칭 (서버 라우터 사용)
  const matched = serverRouter.findRoute(pathname);
  const route = matched
    ? { path: matched.path, params: matched.params, handler: matched.handler }
    : { path: "*", params: {}, handler: null };

  // 2.5 메타데이터 계산 (서버 라우터의 핸들러를 메타 정보 소스로 활용)
  const meta = typeof route.handler === "function" ? route.handler(route.params, query) : { title: "" };

  // 3. 데이터 프리페칭 (상품 상세 페이지도 홈페이지 데이터 먼저 로드)
  if (route.path === "/product/:id") {
    await prefetchData({ path: "/", params: {} }, {});
  }
  const data = await prefetchData(route, route.params);

  // 4. HTML 생성
  let html = "";

  if (route.path === "/") {
    const headerLeft = `
        <h1 class="text-xl font-bold text-gray-900">
          <a href="/" data-link>쇼핑몰</a>
        </h1>
      `.trim();

    const children = `
        ${SearchBar({
          searchQuery: "",
          limit: 20,
          sort: "price_asc",
          category: {},
          categories: store.categories,
        })}
        <div class="mb-6">
          ${ProductList({
            products: data.products || [],
            loading: false,
            error: null,
            totalCount: data.products?.length || 0,
            hasMore: false,
          })}
        </div>
      `.trim();

    html = PageWrapper({ headerLeft, children });
  } else if (route.path === "/product/:id") {
    const product = data.currentProduct;
    html = `
      <div>
        <h1>${product?.name || "상품 상세"}</h1>
        <p>가격: ${product?.price?.toLocaleString() || 0}원</p>
        <button>장바구니 추가</button>
      </div>
    `;
  } else {
    html = `<div><h1>페이지를 찾을 수 없습니다</h1><p>URL: ${pathname}</p></div>`;
  }

  return {
    html,
    head: `<title>${meta?.title ?? (route.path === "/" ? "홈" : route.path === "/product/:id" ? "상품상세" : "오류")}</title>`,
    __INITIAL_DATA__: { route: route.path, params: route.params, query, store },
  };
}
