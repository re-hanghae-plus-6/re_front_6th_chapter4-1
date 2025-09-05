import items from "../mocks/items.json" with { type: "json" };

// 카테고리 추출 함수
function getUniqueCategories() {
  const categories = {};

  items.forEach((item) => {
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

  // 검색어
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(
      (item) => item.title.toLowerCase().includes(searchTerm) || item.brand.toLowerCase().includes(searchTerm),
    );
  }

  // 카테고리
  if (query.category1) {
    filtered = filtered.filter((item) => item.category1 === query.category1);
  }
  if (query.category2) {
    filtered = filtered.filter((item) => item.category2 === query.category2);
  }

  // 정렬 처리
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

// 서버용 API 함수들

export async function mockGetProducts(params = {}) {
  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
  const page = params.current ?? params.page ?? 1;

  // 필터링
  const filteredProducts = filterProducts(items, {
    search,
    category1,
    category2,
    sort,
  });

  // 페이지네이션 처리
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

export async function mockGetProduct(productId) {
  const product = items.find((item) => item.productId === productId);

  if (!product) {
    throw new Error("Product not found");
  }

  // 관련 상품 찾기 (같은 카테고리의 다른 상품들)
  const relatedProducts = items
    .filter(
      (item) =>
        item.productId !== productId && (item.category1 === product.category1 || item.category2 === product.category2),
    )
    .slice(0, 20);

  // 상세 정보에 추가 데이터 포함
  return {
    ...product,
    description: `${product.title}에 대한 상세 설명입니다. ${product.brand} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
    rating: Math.floor(Math.random() * 2) + 4,
    reviewCount: Math.floor(Math.random() * 1000) + 50,
    stock: Math.floor(Math.random() * 100) + 10,
    images: [product.image, product.image.replace(".jpg", "_2.jpg"), product.image.replace(".jpg", "_3.jpg")],
    relatedProducts,
  };
}

export async function mockGetCategories() {
  return getUniqueCategories();
}
