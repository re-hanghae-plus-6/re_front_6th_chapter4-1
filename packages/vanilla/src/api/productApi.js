// 서버/클라이언트 환경 분기 처리
const isServer = typeof window === "undefined";

/**
 * 클라이언트 환경에서 fetch 요청
 */
async function clientFetch(url) {
  const response = await fetch(url);
  return response.json();
}

/**
 * 상품 목록 조회
 */
export async function getProducts(params = {}) {
  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
  const page = params.current ?? params.page ?? 1;

  // 쿼리 파라미터 생성 (빈값 제외)
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(category1 && { category1 }),
    ...(category2 && { category2 }),
    sort,
  });

  if (isServer) {
    try {
      const { getProductsOnServer } = await import("../mocks/server.js");
      return getProductsOnServer({ page, limit, search, category1, category2, sort });
    } catch (error) {
      console.warn("서버 데이터 로드 실패:", error);
      return {
        products: [],
        pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false },
      };
    }
  }

  return clientFetch(`/api/products?${searchParams}`);
}

/**
 * 개별 상품 조회
 */
export async function getProduct(productId) {
  if (isServer) {
    try {
      const { default: items } = await import("../mocks/items.json");
      const product = items.find((item) => item.productId === productId);

      if (!product) throw new Error("Product not found");

      // 추가 상품 정보 생성
      return {
        ...product,
        description: `${product.title}에 대한 상세 설명입니다. ${product.brand} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
        rating: Math.floor(Math.random() * 2) + 4,
        reviewCount: Math.floor(Math.random() * 1000) + 50,
        stock: Math.floor(Math.random() * 100) + 10,
        images: [product.image, product.image.replace(".jpg", "_2.jpg"), product.image.replace(".jpg", "_3.jpg")],
      };
    } catch (error) {
      console.warn("서버 데이터 로드 실패:", error);
      throw new Error("Product not found");
    }
  }

  return clientFetch(`/api/products/${productId}`);
}

/**
 * 카테고리 목록 조회
 */
export async function getCategories() {
  if (isServer) {
    try {
      const { getUniqueCategories } = await import("../mocks/server.js");
      return getUniqueCategories();
    } catch (error) {
      console.warn("서버 데이터 로드 실패:", error);
      return {};
    }
  }

  return clientFetch("/api/categories");
}
