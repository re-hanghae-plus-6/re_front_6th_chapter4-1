import { getCategories, getProduct, getProducts } from "../src/api/productApi.js";

/**
 * 서버 상태 관리자
 */
export class ServerStateManager {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5분 캐시
  }

  /**
   * 홈페이지 상태 초기화
   */
  async initializeHomeState(query = {}) {
    const cacheKey = `home-${JSON.stringify(query)}`;

    // 캐시 확인
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log("📋 홈페이지 상태 캐시 사용");
        return cached.data;
      }
    }

    console.log("🔄 홈페이지 상태 초기화 시작");

    try {
      const [productsData, categories] = await Promise.all([getProducts(query), getCategories()]);

      const state = {
        products: productsData.products,
        categories,
        pagination: productsData.pagination,
        totalCount: productsData.pagination.total,
        loading: false,
        status: "done",
        query,
      };

      // 캐시 저장
      this.cache.set(cacheKey, {
        data: state,
        timestamp: Date.now(),
      });

      console.log("✅ 홈페이지 상태 초기화 완료:", {
        productsCount: state.products.length,
        totalCount: state.totalCount,
        categoriesCount: Object.keys(state.categories).length,
      });

      return state;
    } catch (error) {
      console.error("❌ 홈페이지 상태 초기화 실패:", error);
      throw error;
    }
  }

  /**
   * 상품 상세 상태 초기화
   */
  async initializeProductDetailState(productId) {
    const cacheKey = `product-${productId}`;

    // 캐시 확인
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log("📋 상품 상세 상태 캐시 사용");
        return cached.data;
      }
    }

    console.log("🔄 상품 상세 상태 초기화 시작:", productId);

    try {
      const [product, categories] = await Promise.all([getProduct(productId), getCategories()]);

      const state = {
        product,
        categories,
        loading: false,
        status: "done",
        productId,
      };

      // 캐시 저장
      this.cache.set(cacheKey, {
        data: state,
        timestamp: Date.now(),
      });

      console.log("✅ 상품 상세 상태 초기화 완료:", {
        productId,
        productName: product?.name,
        categoriesCount: Object.keys(categories).length,
      });

      return state;
    } catch (error) {
      console.error("❌ 상품 상세 상태 초기화 실패:", error);
      throw error;
    }
  }

  /**
   * 캐시 클리어
   */
  clearCache() {
    this.cache.clear();
    console.log("🗑️ 서버 상태 캐시 클리어");
  }

  /**
   * 만료된 캐시 정리
   */
  cleanupExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }
}

// 전역 상태 관리자 인스턴스
export const serverStateManager = new ServerStateManager();
