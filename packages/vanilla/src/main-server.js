// 서버용 렌더링 - 직접 데이터 읽기
import fs from "fs";
import path from "path";

// 서버용 라우터 (요구사항에 맞게 구현)
class ServerRouter {
  constructor() {
    this.routes = new Map();
  }

  addRoute(path, handler) {
    // :id → ([^/]+) 정규식 변환
    const paramNames = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1));
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    const regex = new RegExp(`^${regexPath}$`);

    this.routes.set(path, {
      regex,
      paramNames,
      handler,
      path,
    });

    // 디버깅용 로그
    console.log(`🔧 라우트 등록: ${path} → ${regex}`);
  }

  findRoute(url) {
    console.log(`🔍 라우트 찾기: ${url}`);
    for (const [, route] of this.routes) {
      console.log(`  테스트: ${url} vs ${route.regex}`);
      const match = url.match(route.regex);
      if (match) {
        console.log(`  ✅ 매칭됨: ${route.path}`);
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        return {
          ...route,
          params,
        };
      }
    }
    console.log(`  ❌ 매칭 안됨`);
    return null;
  }
}

// 서버용 데이터 읽기 (직접 파일에서 읽기)
function getProductsFromFile(query = {}) {
  try {
    const itemsPath = path.join(process.cwd(), "src/mocks/items.json");
    const items = JSON.parse(fs.readFileSync(itemsPath, "utf-8"));

    let filteredItems = items;

    // 검색 필터링
    if (query.search) {
      filteredItems = filteredItems.filter((item) => item.title.toLowerCase().includes(query.search.toLowerCase()));
    }

    // 카테고리 필터링
    if (query.category1) {
      filteredItems = filteredItems.filter((item) => item.category1 === query.category1);
    }

    if (query.category2) {
      filteredItems = filteredItems.filter((item) => item.category2 === query.category2);
    }

    // 정렬
    if (query.sort === "price_asc") {
      filteredItems.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
    } else if (query.sort === "price_desc") {
      filteredItems.sort((a, b) => parseInt(b.lprice) - parseInt(a.lprice));
    } else if (query.sort === "name_asc") {
      filteredItems.sort((a, b) => a.title.localeCompare(b.title));
    } else if (query.sort === "name_desc") {
      filteredItems.sort((a, b) => b.title.localeCompare(a.title));
    }

    // 페이지네이션
    const limit = parseInt(query.limit) || 20;
    const page = parseInt(query.page) || 1;
    const start = (page - 1) * limit;
    const end = start + limit;

    return {
      products: filteredItems.slice(start, end),
      pagination: {
        total: filteredItems.length,
        page,
        limit,
        totalPages: Math.ceil(filteredItems.length / limit),
      },
    };
  } catch (error) {
    console.error("데이터 읽기 오류:", error);
    return { products: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 0 } };
  }
}

function getProductFromFile(productId) {
  try {
    const itemsPath = path.join(process.cwd(), "src/mocks/items.json");
    const items = JSON.parse(fs.readFileSync(itemsPath, "utf-8"));
    return items.find((item) => item.productId === productId) || null;
  } catch (error) {
    console.error("상품 데이터 읽기 오류:", error);
    return null;
  }
}

function getCategoriesFromFile() {
  try {
    const itemsPath = path.join(process.cwd(), "src/mocks/items.json");
    const items = JSON.parse(fs.readFileSync(itemsPath, "utf-8"));

    const categories = {};
    items.forEach((item) => {
      if (!categories[item.category1]) {
        categories[item.category1] = {};
      }
      if (!categories[item.category1][item.category2]) {
        categories[item.category1][item.category2] = {};
      }
    });

    return categories;
  } catch (error) {
    console.error("카테고리 데이터 읽기 오류:", error);
    return {};
  }
}

// 서버용 데이터 프리페칭 (요구사항에 맞게 구현)
async function prefetchData(route, params, query = {}) {
  try {
    if (route?.path === "/") {
      // 홈페이지: 상품 목록과 카테고리 로드
      const productsResponse = getProductsFromFile(query);
      const categoriesResponse = getCategoriesFromFile();

      return {
        products: productsResponse.products,
        categories: categoriesResponse,
        totalCount: productsResponse.pagination.total,
        loading: false,
        status: "done",
      };
    } else if (route?.path === "/product/:id/") {
      // 상품 상세 페이지: 현재 상품과 관련 상품 로드
      const currentProduct = getProductFromFile(params.id);

      if (currentProduct) {
        // 관련 상품 로드
        const relatedResponse = getProductsFromFile({
          category2: currentProduct.category2,
          limit: 20,
          page: 1,
        });

        const relatedProducts = relatedResponse.products.filter((p) => p.productId !== params.id);

        return {
          currentProduct,
          relatedProducts,
          loading: false,
          status: "done",
        };
      }
    }

    return {
      products: [],
      totalCount: 0,
      currentProduct: null,
      relatedProducts: [],
      loading: false,
      status: "done",
    };
  } catch (error) {
    console.error("서버 데이터 프리페칭 실패:", error);
    return {
      products: [],
      totalCount: 0,
      currentProduct: null,
      relatedProducts: [],
      loading: false,
      error: error.message,
      status: "error",
    };
  }
}

// 메타태그 생성
function generateHead(title, description = "") {
  return `
    <title>${title}</title>
    <meta name="description" content="${description}">
  `;
}

// 간단한 HTML 생성 (실제 컴포넌트 대신)
function generateHomePageHtml(initialData) {
  const { products = [], totalCount = 0 } = initialData;

  return `
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-3xl font-bold mb-6">쇼핑몰</h1>
      <p class="text-gray-600 mb-4">총 ${totalCount}개 상품</p>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        ${products
          .map(
            (product) => `
          <div class="border rounded-lg p-4">
            <img src="${product.image}" alt="${product.title}" class="w-full h-48 object-cover mb-2">
            <h3 class="font-semibold text-sm mb-1">${product.title}</h3>
            <p class="text-blue-600 font-bold">${product.lprice}원</p>
          </div>
        `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function generateProductDetailPageHtml(initialData) {
  const { currentProduct } = initialData;

  if (!currentProduct) {
    return generateNotFoundPageHtml();
  }

  return `
    <div class="container mx-auto px-4 py-8">
      <div class="flex">
        <div class="w-1/2">
          <img src="${currentProduct.image}" alt="${currentProduct.title}" class="w-full">
        </div>
        <div class="w-1/2 pl-8">
          <h1 class="text-2xl font-bold mb-4">${currentProduct.title}</h1>
          <p class="text-2xl text-blue-600 font-bold mb-4">${currentProduct.lprice}원</p>
          <p class="text-gray-600 mb-4">${currentProduct.mallName}</p>
          <button class="bg-blue-600 text-white px-6 py-2 rounded">장바구니 담기</button>
        </div>
      </div>
    </div>
  `;
}

function generateNotFoundPageHtml() {
  return `
    <div class="container mx-auto px-4 py-8 text-center">
      <h1 class="text-4xl font-bold mb-4">404</h1>
      <p class="text-gray-600 mb-4">페이지를 찾을 수 없습니다.</p>
      <a href="/" class="text-blue-600">홈으로 돌아가기</a>
    </div>
  `;
}

// 메인 렌더링 함수 (요구사항에 맞게 구현)
export async function render(url, query = {}) {
  console.log("🔄 서버 렌더링 시작:", url);

  // 라우터 초기화 및 라우트 등록
  const router = new ServerRouter();
  router.addRoute("/", "home");
  router.addRoute("/product/:id/", "product");

  // URL 정규화 (쿼리 파라미터 제거)
  const normalizedUrl = url.split("?")[0];
  console.log("🔧 정규화된 URL:", normalizedUrl);

  // 쿼리 파라미터 추출
  const queryString = url.includes("?") ? url.split("?")[1] : "";
  const urlQuery = {};
  if (queryString) {
    const params = new URLSearchParams(queryString);
    for (const [key, value] of params) {
      urlQuery[key] = value;
    }
  }
  // 서버에서 전달받은 query와 URL의 query 병합
  const finalQuery = { ...urlQuery, ...query };
  console.log("🔍 쿼리 파라미터:", finalQuery);

  // 라우트 매칭 (빈 URL은 홈페이지로 처리)
  let route = router.findRoute(normalizedUrl);
  if (!route && (normalizedUrl === "" || normalizedUrl === "/")) {
    route = { path: "/", params: {} };
  }
  console.log("📍 라우트 매칭:", route);

  // 데이터 프리페칭
  const initialData = await prefetchData(route, route?.params || {}, finalQuery);
  console.log("📊 데이터 프리페칭 완료");

  // HTML 생성
  let html = "";
  let head = "";

  if (route?.path === "/") {
    // 홈페이지
    html = generateHomePageHtml(initialData);
    head = generateHead("쇼핑몰 - 홈", "다양한 상품을 만나보세요");
  } else if (route?.path === "/product/:id/") {
    // 상품 상세 페이지
    const { currentProduct } = initialData;

    if (currentProduct) {
      html = generateProductDetailPageHtml(initialData);
      head = generateHead(`${currentProduct.title} - 쇼핑몰`, currentProduct.title);
    } else {
      html = generateNotFoundPageHtml();
      head = generateHead("페이지를 찾을 수 없습니다 - 쇼핑몰");
    }
  } else {
    // 404 페이지
    html = generateNotFoundPageHtml();
    head = generateHead("페이지를 찾을 수 없습니다 - 쇼핑몰");
  }

  console.log("✅ 서버 렌더링 완료");
  return { html, head, initialData };
}
