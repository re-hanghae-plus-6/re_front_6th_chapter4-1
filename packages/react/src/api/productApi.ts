import type { Categories, Product } from "../entities";
import type { StringRecord } from "../types";
import { apiFetch } from "../utils";

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

// 상품 목록 조회
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

  const response = await apiFetch(`/api/products?${searchParams}`);

  return await response.json();
}

// 상품 상세 조회
export async function getProduct(productId: string): Promise<Product> {
  const response = await apiFetch(`/api/products/${productId}`);
  return await response.json();
}

// 카테고리 목록 조회
export async function getCategories(): Promise<Categories> {
  const response = await apiFetch("/api/categories");
  return await response.json();
}
