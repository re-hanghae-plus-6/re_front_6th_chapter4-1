import items from "./items.json" with { type: "json" };

/**
 * 모든 상품에서 고유한 카테고리 구조를 추출합니다.
 * @returns {Object} 중첩된 카테고리 객체 (대분류 > 소분류)
 */
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

/**
 * 상품 배열을 검색어, 카테고리, 정렬 조건으로 필터링합니다.
 * @param {Array} products - 필터링할 상품 배열
 * @param {Object} query - 필터링 조건
 * @param {string} [query.search] - 제목/브랜드 검색어
 * @param {string} [query.category1] - 대분류 카테고리
 * @param {string} [query.category2] - 소분류 카테고리
 * @param {string} [query.sort] - 정렬 방식 (price_asc, price_desc, name_asc, name_desc)
 * @returns {Array} 필터링 및 정렬된 상품 배열
 */
export function filterProducts(products, query) {
  const searchApplied = query.search
    ? products.filter(
        (item) =>
          item.title.toLowerCase().includes(query.search.toLowerCase()) ||
          item.brand.toLowerCase().includes(query.search.toLowerCase()),
      )
    : products;

  const category1Applied = query.category1
    ? searchApplied.filter((item) => item.category1 === query.category1)
    : searchApplied;

  const category2Applied = query.category2
    ? category1Applied.filter((item) => item.category2 === query.category2)
    : category1Applied;

  const sorted = (() => {
    if (!query.sort) return category2Applied;
    switch (query.sort) {
      case "price_asc":
        return [...category2Applied].sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
      case "price_desc":
        return [...category2Applied].sort((a, b) => parseInt(b.lprice) - parseInt(a.lprice));
      case "name_asc":
        return [...category2Applied].sort((a, b) => a.title.localeCompare(b.title, "ko"));
      case "name_desc":
        return [...category2Applied].sort((a, b) => b.title.localeCompare(a.title, "ko"));
      default:
        return [...category2Applied].sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
    }
  })();

  return sorted;
}

/**
 * 상품 목록을 조회합니다. (무한스크롤 방식 페이지네이션)
 * @param {Object} [query={}] - 조회 조건
 * @param {number} [query.page=1] - 페이지 번호
 * @param {number} [query.limit=20] - 페이지당 상품 수
 * @param {string} [query.search] - 검색어
 * @param {string} [query.category1] - 대분류 카테고리
 * @param {string} [query.category2] - 소분류 카테고리
 * @param {string} [query.sort="price_asc"] - 정렬 방식
 * @returns {Promise<Object>} 상품 목록과 페이지네이션 정보
 */
export async function mockGetProducts(query = {}) {
  const normalized = {
    page: Number(query?.page ?? query?.current ?? 1),
    limit: Number(query?.limit ?? 20),
    search: query?.search ?? "",
    category1: query?.category1 ?? "",
    category2: query?.category2 ?? "",
    sort: query?.sort ?? "price_asc",
  };

  const filteredProducts = filterProducts(items, normalized);

  const uptoEnd = Math.min(filteredProducts.length, normalized.page * normalized.limit);
  const productsForResponse = filteredProducts.slice(0, uptoEnd);

  return {
    products: productsForResponse,
    pagination: {
      page: normalized.page,
      limit: normalized.limit,
      total: filteredProducts.length,
      totalPages: Math.ceil(filteredProducts.length / normalized.limit),
      hasNext: uptoEnd < filteredProducts.length,
      hasPrev: normalized.page > 1,
    },
  };
}

/**
 * 특정 상품의 상세 정보를 조회합니다.
 * @param {string} id - 상품 ID
 * @returns {Promise<Object|null>} 상품 상세 정보 (없으면 null)
 */
export async function mockGetProduct(id) {
  const product = items.find((item) => item.productId === id);
  if (!product) return null;

  return {
    ...product,
    description: `${product.title}에 대한 상세 설명입니다.`,
    rating: Math.floor(Math.random() * 2) + 4,
    reviewCount: Math.floor(Math.random() * 1000) + 50,
    stock: Math.floor(Math.random() * 100) + 10,
    images: [product.image, product.image.replace(".jpg", "_2.jpg"), product.image.replace(".jpg", "_3.jpg")],
  };
}

/**
 * 모든 카테고리 구조를 조회합니다.
 * @returns {Promise<Object>} 카테고리 구조 객체
 */
export async function mockGetCategories() {
  const categories = getUniqueCategories();
  return categories;
}
