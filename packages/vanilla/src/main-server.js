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

// MSW는 server.js에서 이미 설정됨
// 서버용 fetch 설정 (절대 URL로 변환)
const originalFetch = global.fetch;
global.fetch = async (url, options) => {
  // 상대 URL을 절대 URL로 변환 (MSW가 제대로 처리할 수 있도록)
  if (typeof url === "string" && url.startsWith("/")) {
    url = `http://localhost:5174${url}`;
  }

  console.log("🔍 서버에서 fetch 호출:", url);

  try {
    const response = await originalFetch(url, options);
    console.log("📦 fetch 응답 상태:", response.status, response.statusText);

    if (url.includes("/api/")) {
      const text = await response.text();
      console.log("📄 API 응답 내용 (첫 100자):", text.substring(0, 100));

      // JSON 파싱 시도
      try {
        const data = JSON.parse(text);
        console.log("✅ JSON 파싱 성공");
        return {
          ...response,
          json: async () => data,
          text: async () => text,
        };
      } catch (e) {
        console.log("❌ JSON 파싱 실패:", e.message);
        return response;
      }
    }

    return response;
  } catch (error) {
    console.error("🚨 fetch 에러:", error.message);
    throw error;
  }
};

// 서버용 Store 모킹
const createServerStore = (initialState) => ({
  getState: () => initialState,
  dispatch: () => {},
  subscribe: () => {},
});

// 서버용 라우터 모킹
const createServerRouter = (url) => {
  const urlObj = new URL(url, "http://localhost");
  const pathname = urlObj.pathname;
  const productMatch = pathname.match(/^\/product\/([^/]+)\/?$/);

  // 쿼리스트링 파싱
  const query = {};
  urlObj.searchParams.forEach((value, key) => {
    query[key] = value;
  });

  return {
    query, // 실제 URL에서 파싱된 쿼리스트링
    params: productMatch ? { id: productMatch[1] } : {}, // URL 파라미터
    baseUrl: "", // 여기서는 의미 없음 (CSR 라우터 호환용)
    target: null, // 필요시 라우트 대상 지정 가능
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

// 기존 컴포넌트를 서버에서 사용하기 위한 렌더링 함수들
async function renderWithExistingComponents(url) {
  console.log("renderWithExistingComponents url:", url);

  // 라우트 판별 (홈페이지, 상세페이지, 404페이지)
  const route = matchRoute(url);

  // 홈페이지 처리
  if (route.type === "home") {
    // 서버용 MSW를 통해 실제 API 호출로 데이터 가져오기
    try {
      // 서버용 router 설정하여 쿼리스트링 파싱
      const serverRouter = createServerRouter(url);

      // 쿼리스트링에서 파라미터 추출 (기본값 설정)
      const page = serverRouter.query.page || "1";
      const limit = serverRouter.query.limit || "20";
      const sort = serverRouter.query.sort || "price_asc";
      const category = serverRouter.query.category || "";
      const search = serverRouter.query.search || "";

      // 실제 쿼리스트링으로 API 호출
      let apiUrl = `/api/products?page=${page}&limit=${limit}&sort=${sort}`;
      if (category) apiUrl += `&category=${category}`;
      if (search) apiUrl += `&search=${encodeURIComponent(search)}`;

      console.log("🔍 서버에서 API 호출 URL:", apiUrl);

      const [productsResponse, categoriesResponse] = await Promise.all([fetch(apiUrl), fetch("/api/categories")]);

      const productsData = await productsResponse.json();
      const categoriesData = await categoriesResponse.json();

      // 서버용 productStore 설정 (서버용 MSW 응답 데이터 사용)
      const serverProductStore = createServerStore({
        products: productsData.products || [],
        totalCount: productsData.pagination?.total || 0,
        loading: false,
        status: "done",
        categories: categoriesData || {},
        currentProduct: null,
        relatedProducts: [],
        error: null,
      });

      console.log("서버용 MSW를 통해 로드된 상품 수:", productsData.products?.length || 0);

      // 전역 store와 router를 서버용으로 설정
      global.productStore = serverProductStore;
      global.router = serverRouter;

      try {
        // 기존 HomePage 컴포넌트 import (동적으로 로드하여 의존성 문제 방지)
        const { HomePage } = await import("./pages/HomePage.js");

        // withLifecycle을 우회하고 순수 렌더링 함수만 실행
        // 한 번 실행해서 리턴이 함수라면 그 함수도 실행함
        // 그렇게 되면 실제 순수 html을 리턴하는 렌더함수가 실행됨
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
    } catch (error) {
      console.error("서버용 MSW 데이터 로딩 실패:", error);
      throw error;
    }
  }

  // 상품 상세 페이지 처리
  if (route.type === "product") {
    // 서버용 MSW를 통해 상품 상세 정보 가져오기
    try {
      const productResponse = await fetch(`/api/products/${route.id}`);

      if (!productResponse.ok) {
        throw new Error(`Product not found: ${route.id}`);
      }

      const product = await productResponse.json();

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

      console.log("🎯 서버용 MSW를 통해 로드된 상품:", product.title);

      const serverRouter = createServerRouter(url);

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
    } catch (error) {
      console.error("서버용 MSW 상품 데이터 로딩 실패:", error);
      throw error;
    }
  }

  // 404 페이지 처리
  if (route.type === "404") {
    try {
      const { NotFoundPage } = await import("./pages/NotFoundPage.js");
      const notFoundPageComponent = NotFoundPage();
      const html = typeof notFoundPageComponent === "function" ? notFoundPageComponent() : notFoundPageComponent;

      return {
        html,
        head: `<title>404 - 페이지를 찾을 수 없습니다</title>`,
        initialData: {},
      };
    } catch (error) {
      console.error("404 페이지 렌더링 실패:", error);
      return {
        html: "<div>404 - 페이지를 찾을 수 없습니다</div>",
        head: `<title>404 - 페이지를 찾을 수 없습니다</title>`,
        initialData: {},
      };
    }
  }

  throw new Error(`Unknown route type: ${route.type}`);
}

export async function render(url) {
  console.log("main-server.js의 render URL:", url);
  return await renderWithExistingComponents(url);
}
