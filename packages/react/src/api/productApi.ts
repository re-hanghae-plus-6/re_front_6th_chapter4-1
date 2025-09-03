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

// SSR(노드)에서는 절대 URL, 브라우저에서는 상대 URL 사용
const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return "";
  }
  const prod = process.env.NODE_ENV === "production";

  return prod ? "http://localhost:4176" : "http://localhost:5176";
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

  const response = await fetch(`${getBaseUrl()}/api/products?${searchParams.toString()}`);
  return await response.json();
}

// 상품 상세 조회
export async function getProduct(productId: string): Promise<Product> {
  const response = await fetch(`${getBaseUrl()}/api/products/${productId}`);
  return await response.json();
}

// 카테고리 목록 조회
export async function getCategories(): Promise<Categories> {
  const response = await fetch(`${getBaseUrl()}/api/categories`);
  return await response.json();
}
