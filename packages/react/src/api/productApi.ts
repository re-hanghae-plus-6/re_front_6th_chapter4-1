// 상품 목록 조회
import type { Categories, Product } from "../entities";
import type { StringRecord } from "../types.ts";

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

// API 기본 URL 설정
const getApiBaseUrl = async () => {
  // Node.js 환경(서버 또는 SSG)인지 확인
  const isServerSide = typeof window === "undefined" || (import.meta.env && import.meta.env.SSR);

  if (isServerSide) {
    // 서버 환경에서는 절대 URL 사용
    // 개발 환경: 5173, SSR 서버: 5174
    const port = process.env.PORT || 5174;

    return `http://localhost:${port}`;
  } else {
    // 클라이언트 환경에서는 상대 URL 사용
    return "";
  }
};

export async function getProducts(params: StringRecord = {}): Promise<ProductsResponse> {
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

  const baseUrl = await getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/products?${searchParams}`);

  return await response.json();
}

// 상품 상세 조회
export async function getProduct(productId: string): Promise<Product> {
  const baseUrl = await getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/products/${productId}`);

  return await response.json();
}

// 카테고리 목록 조회
export async function getCategories(): Promise<Categories> {
  const baseUrl = await getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/categories`);

  return await response.json();
}
