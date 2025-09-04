// 서버 환경 체크
const isServer = typeof window === "undefined";

export async function getProducts(params = {}) {
  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
  const page = params.current ?? params.page ?? 1;

  // 서버 환경에서는 직접 함수 호출
  if (isServer) {
    try {
      const { getProductsOnServer } = await import("../mocks/server.js");
      return getProductsOnServer({ page, limit, search, category1, category2, sort });
    } catch (error) {
      console.warn("서버 데이터 로드 실패:", error);
      // 서버 데이터 로드 실패 시 빈 결과 반환
      return { products: [], pagination: { page, limit, total: 0, totalPages: 0, hasNext: false, hasPrev: false } };
    }
  }

  // 브라우저 환경에서는 fetch 사용
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(category1 && { category1 }),
    ...(category2 && { category2 }),
    sort,
  });

  const response = await fetch(`/api/products?${searchParams}`);
  return await response.json();
}

export async function getProduct(productId) {
  // 서버 환경에서는 직접 데이터 검색
  if (isServer) {
    try {
      const itemsModule = await import("../mocks/items.json", { assert: { type: "json" } });
      const items = itemsModule.default;
      const product = items.find((item) => item.productId === productId);

      if (!product) {
        throw new Error("Product not found");
      }

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

  // 브라우저 환경에서는 fetch 사용
  const response = await fetch(`/api/products/${productId}`);
  return await response.json();
}

export async function getCategories() {
  // 서버 환경에서는 직접 함수 호출
  if (isServer) {
    try {
      const { getUniqueCategories } = await import("../mocks/server.js");
      return getUniqueCategories();
    } catch (error) {
      console.warn("서버 데이터 로드 실패:", error);
      return {};
    }
  }

  // 브라우저 환경에서는 fetch 사용
  const response = await fetch("/api/categories");
  return await response.json();
}
