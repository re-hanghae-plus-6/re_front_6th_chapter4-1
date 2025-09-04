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

const API_BASE = typeof window !== "undefined" ? window.location.origin : "http://localhost:5176"; // 또는 환경변수로 설정

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

  const url = new URL(`/api/products?${searchParams}`, API_BASE);
  const response = await fetch(url);

  return await response.json();
}

// 상품 상세 조회
export async function getProduct(productId: string): Promise<Product> {
  const url = new URL(`/api/products/${productId}`, API_BASE);
  const response = await fetch(url);
  return await response.json();
}

// 카테고리 목록 조회
export async function getCategories(): Promise<Categories> {
  const url = new URL("/api/categories", API_BASE);
  const response = await fetch(url);
  return await response.json();
}
