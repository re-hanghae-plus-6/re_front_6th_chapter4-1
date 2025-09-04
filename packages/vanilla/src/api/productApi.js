const getServerPort = () => {
  if (typeof window !== "undefined") return ""; // 클라이언트에서는 빈 문자열

  // 서버에서는 환경에 따라 포트 결정
  if (process.env.NODE_ENV === "production") {
    return process.env.PORT || 4174; // 프로덕션은 4174
  } else {
    return process.env.PORT || 5174; // 개발은 5174
  }
};

const API_BASE_URL = typeof window !== "undefined" ? "" : `http://localhost:${getServerPort()}`;

// SSG 빌드 시 JSON 파일에서 직접 데이터 로드
const isSSGBuild = () => {
  return typeof window === "undefined" && process.env.BUILD_MODE === "ssg";
};

export async function getProducts(params = {}) {
  // SSG 빌드 시에는 JSON 파일에서 직접 로드
  if (isSSGBuild()) {
    const items = await import("../mocks/items.json");
    return getProductsFromJSON(items.default, params);
  }

  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
  const page = params.current ?? params.page ?? 1;

  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(category1 && { category1 }),
    ...(category2 && { category2 }),
    sort,
  });

  const response = await fetch(`${API_BASE_URL}/api/products?${searchParams}`);

  return await response.json();
}

export async function getProduct(productId) {
  // SSG 빌드 시에는 JSON 파일에서 직접 로드
  if (isSSGBuild()) {
    const items = await import("../mocks/items.json");
    return getProductFromJSON(items.default, productId);
  }

  const response = await fetch(`${API_BASE_URL}/api/products/${productId}`);
  return await response.json();
}

export async function getCategories() {
  // SSG 빌드 시에는 JSON 파일에서 직접 로드
  if (isSSGBuild()) {
    const items = await import("../mocks/items.json");
    return getCategoriesFromJSON(items.default);
  }

  const response = await fetch(`${API_BASE_URL}/api/categories`);
  return await response.json();
}

// JSON 파일에서 상품 목록을 가져오는 함수
function getProductsFromJSON(items, params = {}) {
  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
  const page = params.current ?? params.page ?? 1;

  let filteredItems = [...items];

  // 검색 필터
  if (search) {
    const searchLower = search.toLowerCase();
    filteredItems = filteredItems.filter(
      (item) => item.title.toLowerCase().includes(searchLower) || item.brand?.toLowerCase().includes(searchLower),
    );
  }

  // 카테고리 필터
  if (category1) {
    filteredItems = filteredItems.filter((item) => item.category1 === category1);
  }
  if (category2) {
    filteredItems = filteredItems.filter((item) => item.category2 === category2);
  }

  // 정렬
  switch (sort) {
    case "price_asc":
      filteredItems.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
      break;
    case "price_desc":
      filteredItems.sort((a, b) => parseInt(b.lprice) - parseInt(a.lprice));
      break;
    case "name_asc":
      filteredItems.sort((a, b) => a.title.localeCompare(b.title));
      break;
    case "name_desc":
      filteredItems.sort((a, b) => b.title.localeCompare(a.title));
      break;
  }

  // 페이지네이션
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  return {
    products: paginatedItems,
    pagination: {
      current: page,
      total: filteredItems.length,
      limit: limit,
    },
  };
}

// JSON 파일에서 단일 상품을 가져오는 함수
function getProductFromJSON(items, productId) {
  const product = items.find((item) => item.productId === productId);
  if (!product) {
    throw new Error(`Product not found: ${productId}`);
  }

  // 상세 정보 추가
  return {
    ...product,
    description: `${product.title}에 대한 상세 설명입니다. ${product.brand} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
    rating: 4,
    reviewCount: 150,
    stock: 50,
    images: [product.image, product.image.replace(".jpg", "_2.jpg"), product.image.replace(".jpg", "_3.jpg")],
  };
}

// JSON 파일에서 카테고리 목록을 가져오는 함수
function getCategoriesFromJSON(items) {
  const categories = {};

  items.forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;

    if (!categories[cat1]) {
      categories[cat1] = {};
    }
    if (cat2 && !categories[cat1][cat2]) {
      categories[cat1][cat2] = {};
    }
  });

  return categories;
}
