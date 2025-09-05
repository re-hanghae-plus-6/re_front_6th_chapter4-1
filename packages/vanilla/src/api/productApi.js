import { isServer } from "../utils";

// MSW 핸들러를 서버에서도 직접 사용하기 위한 캐시
// let serverHandlers = null;
let itemsData = null;

// 서버 환경에서 items.json 데이터 로드
async function getItemsData() {
  if (!itemsData && isServer) {
    try {
      const itemsModule = await import("../mocks/items.json", { with: { type: "json" } });
      itemsData = itemsModule.default;
    } catch (error) {
      console.error("Failed to load items.json:", error);
      itemsData = [];
    }
  }
  return itemsData || [];
}

// 카테고리 추출 함수
function getUniqueCategories(itemsList) {
  const categories = {};

  itemsList.forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;

    if (!categories[cat1]) categories[cat1] = {};
    if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {};
  });

  return categories;
}

// 상품 검색 및 필터링 함수
function filterProducts(products, query) {
  let filtered = [...products];

  // 검색어 필터링
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(
      (item) => item.title.toLowerCase().includes(searchTerm) || item.brand.toLowerCase().includes(searchTerm),
    );
  }

  // 카테고리 필터링
  if (query.category1) {
    filtered = filtered.filter((item) => item.category1 === query.category1);
  }
  if (query.category2) {
    filtered = filtered.filter((item) => item.category2 === query.category2);
  }

  // 정렬
  if (query.sort) {
    switch (query.sort) {
      case "price_asc":
        filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
        break;
      case "price_desc":
        filtered.sort((a, b) => parseInt(b.lprice) - parseInt(a.lprice));
        break;
      case "name_asc":
        filtered.sort((a, b) => a.title.localeCompare(b.title, "ko"));
        break;
      case "name_desc":
        filtered.sort((a, b) => b.title.localeCompare(a.title, "ko"));
        break;
      default:
        // 기본은 가격 낮은 순
        filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
    }
  }

  return filtered;
}

// 서버 환경에서 MSW 핸들러 로직을 직접 실행
async function serverGetProducts(params = {}) {
  const itemsList = await getItemsData();
  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
  const page = params.current ?? params.page ?? 1;

  // 필터링된 상품들
  const filteredProducts = filterProducts(itemsList, {
    search,
    category1,
    category2,
    sort,
  });

  // 페이지네이션
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // 응답 데이터
  return {
    products: paginatedProducts,
    pagination: {
      page,
      limit,
      total: filteredProducts.length,
      totalPages: Math.ceil(filteredProducts.length / limit),
      hasNext: endIndex < filteredProducts.length,
      hasPrev: page > 1,
    },
    filters: {
      search,
      category1,
      category2,
      sort,
    },
  };
}

async function serverGetProduct(productId) {
  const itemsList = await getItemsData();
  const product = itemsList.find((item) => item.productId === productId);

  if (!product) {
    throw new Error("Product not found");
  }

  // 상세 정보에 추가 데이터 포함
  return {
    ...product,
    description: `${product.title}에 대한 상세 설명입니다. ${product.brand} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
    rating: Math.floor(Math.random() * 2) + 4, // 4~5점 랜덤
    reviewCount: Math.floor(Math.random() * 1000) + 50, // 50~1050개 랜덤
    stock: Math.floor(Math.random() * 100) + 10, // 10~110개 랜덤
    images: [product.image, product.image.replace(".jpg", "_2.jpg"), product.image.replace(".jpg", "_3.jpg")],
  };
}

async function serverGetCategories() {
  const itemsList = await getItemsData();
  return getUniqueCategories(itemsList);
}

// 공용 API 함수들
export async function getProducts(params = {}) {
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

  if (isServer) {
    // 서버 환경: 직접 로직 실행
    return await serverGetProducts(params);
  } else {
    // 클라이언트 환경: fetch 사용
    const response = await fetch(`/api/products?${searchParams}`);
    return await response.json();
  }
}

export async function getProduct(productId) {
  if (isServer) {
    // 서버 환경: 직접 로직 실행
    return await serverGetProduct(productId);
  } else {
    // 클라이언트 환경: fetch 사용
    const response = await fetch(`/api/products/${productId}`);
    return await response.json();
  }
}

export async function getCategories() {
  if (isServer) {
    // 서버 환경: 직접 로직 실행
    return await serverGetCategories();
  } else {
    // 클라이언트 환경: fetch 사용
    const response = await fetch("/api/categories");
    return await response.json();
  }
}
