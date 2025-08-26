import type { StringRecord } from "../types";
import type { Product } from "../entities";
import items from "../mocks/items.json" with { type: "json" };

// 카테고리 추출 함수
function getUniqueCategories() {
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

// 서버 사이드용 API 함수들 (직접 mock 데이터 사용)
async function getProductsSSR(params: StringRecord = {}) {
  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
  const page = parseInt(params.current ?? params.page ?? "1");

  // 필터링된 상품들
  const filteredProducts = filterProducts(items, {
    search,
    category1,
    category2,
    sort,
  });

  // 페이지네이션
  const startIndex = (page - 1) * Number(limit);
  const endIndex = startIndex + Number(limit);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // 응답 데이터
  return {
    products: paginatedProducts,
    pagination: {
      page,
      limit,
      total: filteredProducts.length,
      totalPages: Math.ceil(filteredProducts.length / Number(limit)),
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

async function getProductSSR(productId: string) {
  const product = items.find((item) => item.productId === productId);

  if (!product) {
    throw new Error("Product not found");
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

  return detailProduct;
}

async function getCategoriesSSR() {
  return getUniqueCategories();
}

// 홈페이지용 데이터 로드
export async function loadHomePageData(url: string) {
  try {
    // URL에서 쿼리 파라미터 추출
    const BASE_URL = "http://localhost:5174/"; // 더미 base URL
    const urlObj = new URL(url, BASE_URL);
    const params: StringRecord = {};

    for (const [key, value] of urlObj.searchParams.entries()) {
      params[key] = value;
    }

    // 기본값 설정
    if (!params.page) params.page = "1";
    if (!params.limit) params.limit = "20";
    if (!params.sort) params.sort = "price_asc";

    console.log("🏠 홈페이지 데이터 로드 시작:", params);

    const [productsResponse, categories] = await Promise.all([getProductsSSR(params), getCategoriesSSR()]);

    console.log("✅ 홈페이지 데이터 로드 완료:", productsResponse.products.length, "개 상품");

    return {
      products: productsResponse.products,
      categories,
      totalCount: productsResponse.pagination.total,
      pagination: productsResponse.pagination,
      filters: productsResponse.filters,
    };
  } catch (error) {
    console.error("❌ 홈페이지 데이터 로드 실패:", error);
    return null;
  }
}

// 상품 상세 페이지용 데이터 로드
export async function loadProductDetailData(productId: string) {
  try {
    console.log("📦 상품 상세 데이터 로드 시작:", productId);

    const currentProduct = await getProductSSR(productId);

    // 관련 상품 로드 (같은 category2의 다른 상품들)
    let relatedProducts: Product[] = [];
    if (currentProduct.category2) {
      const relatedResponse = await getProductsSSR({
        category2: currentProduct.category2,
        limit: "20",
        page: "1",
      });

      // 현재 상품 제외
      relatedProducts = relatedResponse.products.filter((product) => product.productId !== currentProduct.productId);
    }

    console.log("✅ 상품 상세 데이터 로드 완료:", currentProduct.title);

    return {
      currentProduct,
      relatedProducts,
    };
  } catch (error) {
    console.error("❌ 상품 상세 데이터 로드 실패:", error);
    return null;
  }
}
