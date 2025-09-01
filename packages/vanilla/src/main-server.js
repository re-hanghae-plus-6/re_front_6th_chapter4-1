import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 서버용 전역 변수 설정
global.window = {
  location: {
    pathname: "/",
    search: "",
    origin: "http://localhost:5174",
    href: "http://localhost:5174/",
  },
  history: { pushState: () => {}, back: () => {} },
  addEventListener: () => {},
};
global.document = {
  getElementById: () => null,
  addEventListener: () => {},
};

// 서버용 fetch 모킹 (상대 URL을 절대 URL로 변환)
const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  if (typeof url === "string" && url.startsWith("/")) {
    // 상대 URL을 절대 URL로 변환
    url = `http://localhost:5174${url}`;
  }

  // 서버에서는 실제 API 호출 대신 목업 데이터 반환
  if (url.includes("/api/products")) {
    const items = loadItems();
    const urlObj = new URL(url);
    const searchParams = urlObj.searchParams;

    if (url.includes("/api/products/")) {
      // 개별 상품 조회
      const productId = url.split("/api/products/")[1];
      const product = items.find((item) => item.productId === productId);
      return {
        ok: true,
        json: async () => product || null,
      };
    } else {
      // 상품 목록 조회
      const page = parseInt(searchParams.get("page") || "1");
      const limit = parseInt(searchParams.get("limit") || "20");
      const start = (page - 1) * limit;
      const end = start + limit;

      return {
        ok: true,
        json: async () => ({
          products: items.slice(start, end),
          pagination: { total: items.length },
        }),
      };
    }
  }

  if (url.includes("/api/categories")) {
    const categories = extractCategories(loadItems());
    return {
      ok: true,
      json: async () => categories,
    };
  }

  // 다른 요청은 원본 fetch 사용
  return originalFetch ? originalFetch(url, options) : Promise.reject(new Error("Fetch not available"));
};

// 서버용 Store 모킹
const createServerStore = (initialState) => ({
  getState: () => initialState,
  dispatch: () => {},
  subscribe: () => {},
});

// 서버용 라우터 모킹
const createServerRouter = (url, query = {}) => {
  const pathname = new URL(url, "http://localhost").pathname;
  const productMatch = pathname.match(/^\/product\/([^/]+)\/?$/);

  return {
    query,
    params: productMatch ? { id: productMatch[1] } : {},
    baseUrl: "",
    target: null,
  };
};

// 서버에서 사용할 라우터
const matchRoute = (url) => {
  const pathname = new URL(url, "http://localhost").pathname;

  // 홈페이지
  if (pathname === "/") {
    return { type: "home" };
  }

  // 상품 상세 페이지
  const productMatch = pathname.match(/^\/product\/([^/]+)\/?$/);
  if (productMatch) {
    return { type: "product", id: productMatch[1] };
  }

  // 그 외 404 페이지
  return { type: "404" };
};

// 카테고리 추출 함수
function extractCategories(items) {
  const categories = {};
  items.forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;
    if (!categories[cat1]) categories[cat1] = {};
    if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {};
  });
  return categories;
}

// 서버에서 JSON 직접 로드
const loadItems = () => {
  try {
    const itemsPath = path.resolve(__dirname, "./mocks/items.json");
    return JSON.parse(fs.readFileSync(itemsPath, "utf-8"));
  } catch (error) {
    console.error("서버 아이템 로드 실패:", error);
    return [];
  }
};

// 기존 컴포넌트를 서버에서 사용하기 위한 렌더링 함수들
async function renderWithExistingComponents(url) {
  const items = loadItems();
  console.log("renderWithExistingComponents url:", url);
  const route = matchRoute(url);

  if (route.type === "home") {
    // 서버용 productStore 설정
    const serverProductStore = createServerStore({
      products: items.slice(0, 20),
      totalCount: items.length,
      loading: false,
      status: "done",
      categories: extractCategories(items),
      currentProduct: null,
      relatedProducts: [],
      error: null,
    });

    // 서버용 router 설정
    const serverRouter = createServerRouter(url, {});

    // 전역 store와 router를 서버용으로 설정
    global.productStore = serverProductStore;
    global.router = serverRouter;

    try {
      // 기존 HomePage 컴포넌트 import (동적으로 로드하여 의존성 문제 방지)
      const { HomePage } = await import("./pages/HomePage.js");

      // withLifecycle을 우회하고 순수 렌더링 함수만 실행
      const homePageComponent = HomePage();
      const html = typeof homePageComponent === "function" ? homePageComponent() : homePageComponent;

      return {
        html,
        head: "<title>쇼핑몰 - 홈</title>",
        initialData: { products: serverProductStore.getState() },
      };
    } catch (error) {
      console.error("기존 홈 컴포넌트 렌더링 실패:", error);
      throw error;
    }
  }

  if (route.type === "product") {
    const product = items.find((item) => item.productId === route.id);

    if (!product) {
      throw new Error(`Product not found: ${route.id}`);
    }

    const serverProductStore = createServerStore({
      products: [],
      totalCount: 0,
      loading: false,
      status: "done",
      categories: {},
      currentProduct: product,
      relatedProducts: [],
      error: null,
    });

    const serverRouter = createServerRouter(url, {});
    serverRouter.params = { id: route.id };

    global.productStore = serverProductStore;
    global.router = serverRouter;

    try {
      const { ProductDetailPage } = await import("./pages/ProductDetailPage.js");
      const productPageComponent = ProductDetailPage();
      const html = typeof productPageComponent === "function" ? productPageComponent() : productPageComponent;

      return {
        html,
        head: `<title>${product.title} - 쇼핑몰</title>`,
        initialData: { products: serverProductStore.getState() },
      };
    } catch (error) {
      console.error("기존 상품 상세 컴포넌트 렌더링 실패:", error);
      throw error;
    }
  }

  throw new Error(`Unknown route type: ${route.type}`);
}

export async function render(url) {
  console.log("main-server.js의 render URL:", url);

  // 기존 컴포넌트만 사용하여 렌더링 (폴백 없음)
  return await renderWithExistingComponents(url);
}
