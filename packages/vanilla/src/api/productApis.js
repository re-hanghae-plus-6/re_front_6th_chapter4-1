import { getProductsOnServer, getUniqueCategories } from "../mocks/server.js";
import items from "../mocks/items.json" with { type: "json" };

export class ClientProductApi {
  async getProducts(params) {
    const searchParams = this.buildSearchParams(params);
    const response = await fetch(`/api/products?${searchParams}`);
    return response.json();
  }

  async getProduct(productId) {
    const response = await fetch(`/api/products/${productId}`);
    return response.json();
  }

  async getCategories() {
    const response = await fetch("/api/categories");
    return response.json();
  }

  buildSearchParams(params) {
    const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
    const page = params.current ?? params.page ?? 1;

    return new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...(search && { search }),
      ...(category1 && { category1 }),
      ...(category2 && { category2 }),
      sort,
    });
  }
}

export class ServerProductApi {
  async getProducts(params) {
    try {
      return await getProductsOnServer(params);
    } catch (error) {
      console.warn("서버 데이터 로드 실패:", error);
      return this.createEmptyResponse(params);
    }
  }

  async getProduct(productId) {
    try {
      const product = items.find((item) => item.productId === productId);
      if (!product) throw new Error("Product not found");

      return this.enhanceProductData(product);
    } catch (error) {
      console.warn("서버 데이터 로드 실패:", error);
      throw new Error("Product not found");
    }
  }

  async getCategories() {
    try {
      return await getUniqueCategories();
    } catch (error) {
      console.warn("서버 데이터 로드 실패:", error);
      return {};
    }
  }

  createEmptyResponse(params) {
    const { limit = 20 } = params;
    const page = params.current ?? params.page ?? 1;

    return {
      products: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    };
  }

  enhanceProductData(product) {
    return {
      ...product,
      description: `${product.title}에 대한 상세 설명입니다. ${product.brand} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
      rating: Math.floor(Math.random() * 2) + 4,
      reviewCount: Math.floor(Math.random() * 1000) + 50,
      stock: Math.floor(Math.random() * 100) + 10,
      images: [product.image, product.image.replace(".jpg", "_2.jpg"), product.image.replace(".jpg", "_3.jpg")],
    };
  }
}
