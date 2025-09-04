import { http, HttpResponse } from "msw";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// items.json을 동적으로 로드하는 함수
function loadItems() {
  try {
    const itemsPath = join(__dirname, "items.json");
    const itemsData = readFileSync(itemsPath, "utf-8");
    return JSON.parse(itemsData);
  } catch (error) {
    console.error("❌ items.json 로드 실패:", error);
    return [];
  }
}

// 캐시된 items 데이터
let items = loadItems();

const delay = async () => await new Promise((resolve) => setTimeout(resolve, 200));

// 카테고리 추출 함수
export function getUniqueCategories() {
  const categories = {};

  items.forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;

    if (!categories[cat1]) categories[cat1] = {};
    if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {};
  });

  return categories;
}

// 상품을 ID로 가져오는 함수
export function getProductById(productId) {
  console.log("🔍 상품 검색 중:", { productId, type: typeof productId });

  // 상품 ID를 문자열로 변환하여 안전하게 비교
  const searchId = String(productId);
  const product = items.find((item) => String(item.productId) === searchId);

  console.log("🎯 상품 검색 결과:", product ? "찾음" : "없음");

  if (!product) {
    return null;
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

// 관련 상품을 가져오는 함수 (같은 category2의 다른 상품들)
export function getRelatedProducts(category2, excludeProductId, limit = 5) {
  if (!category2) return [];

  return items
    .filter((item) => item.category2 === category2 && item.productId !== excludeProductId)
    .slice(0, limit)
    .map((item) => ({
      ...item,
      description: `${item.title}에 대한 상세 설명입니다. ${item.brand} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
      rating: Math.floor(Math.random() * 2) + 4,
      reviewCount: Math.floor(Math.random() * 1000) + 50,
      stock: Math.floor(Math.random() * 100) + 10,
    }));
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

export function getProductsOnServer(query = {}) {
  const page = parseInt(query.page ?? query.current) || 1;
  const limit = parseInt(query.limit) || 20;
  const search = query.search || "";
  const category1 = query.category1 || "";
  const category2 = query.category2 || "";
  const sort = query.sort || "price_asc";

  // 필터링된 상품들
  const filteredProducts = filterProducts(items, {
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

const handlers = [
  // 상품 상세 API
  http.get("/api/products/:id", ({ params }) => {
    const { id } = params;
    const product = items.find((item) => item.productId === id);

    if (!product) {
      return HttpResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // 상세 정보에 추가 데이터 포함
    const detailProduct = {
      ...product,
      description: `${product.title}에 대한 상세 설명입니다. ${product.brand} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
      rating: Math.floor(Math.random() * 2) + 4, // 4~5점 랜덤
      reviewCount: Math.floor(Math.random() * 1000) + 50, // 50~1050개 랜덤
      stock: Math.floor(Math.random() * 100) + 10, // 10~110개 랜덤
      images: [product.image, product.image.replace(".jpg", "_2.jpg"), product.image.replace(".jpg", "_3.jpg")],
    };

    return HttpResponse.json(detailProduct);
  }),

  // 카테고리 목록 API
  http.get("/api/categories", async () => {
    const categories = getUniqueCategories();
    await delay();
    return HttpResponse.json(categories);
  }),
];
