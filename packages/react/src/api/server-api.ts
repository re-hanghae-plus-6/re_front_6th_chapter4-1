import items from "../mocks/items.json" with { type: "json" };
import type { Product, Categories } from "../entities";
import type { StringRecord } from "../types";

interface ProductsResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: {
    search: string;
    category1: string;
    category2: string;
    sort: string;
  };
}

// 카테고리 추출 함수
function getUniqueCategories(): Categories {
  const categories: Record<string, Record<string, string | StringRecord>> = {};

  items.forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;

    if (!categories[cat1]) categories[cat1] = {};
    if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {};
  });

  return categories;
}

// 상품 검색 및 필터링 함수
function filterProducts(products: Product[], query: Record<string, string>) {
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

// 서버용 상품 목록 조회
export function getProductsServer(params: StringRecord = {}): ProductsResponse {
  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
  const page = parseInt(String(params.current ?? params.page ?? 1));
  const limitNum = parseInt(String(limit));

  // 필터링된 상품들
  const filteredProducts = filterProducts(items, {
    search,
    category1,
    category2,
    sort,
  });

  // 페이지네이션
  const startIndex = (page - 1) * limitNum;
  const endIndex = startIndex + limitNum;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  return {
    products: paginatedProducts,
    pagination: {
      page,
      limit: limitNum,
      total: filteredProducts.length,
      totalPages: Math.ceil(filteredProducts.length / limitNum),
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

// 서버용 상품 상세 조회
export function getProductServer(productId: string): Product {
  const product = items.find((item) => item.productId === productId);

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

// 서버용 카테고리 목록 조회
export function getCategoriesServer(): Categories {
  return getUniqueCategories();
}
