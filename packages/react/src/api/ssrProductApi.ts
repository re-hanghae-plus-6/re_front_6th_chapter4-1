import { getProduct, getProducts, getCategories } from "./productApi.ts";
import type { Product, Categories } from "../entities";
import type { StringRecord } from "@hanghae-plus/lib";

// 상품 목록 SSR 반환 타입
export interface ProductsSSRResult {
  products: Product[];
  categories: Categories;
  totalCount: number;
  loading: boolean;
  error: string | null;
}

// 상품 상세 SSR 반환 타입
export interface ProductDetailSSRResult {
  currentProduct: Product | null;
  relatedProducts: Product[];
  loading: boolean;
  error: string | null;
}

export async function fetchProductsDataSSR(query: StringRecord = {}): Promise<ProductsSSRResult> {
  try {
    const [productsData, categories] = await Promise.all([getProducts({ ...query }), getCategories()]);

    return {
      products: productsData.products,
      categories,
      totalCount: productsData.pagination.total,
      loading: false,
      error: null,
    };
  } catch (error) {
    const e = error as Error;
    console.error("SSR fetch error:", error);
    return {
      products: [],
      categories: {},
      totalCount: 0,
      loading: false,
      error: e.message,
    };
  }
}

export async function fetchProductDataSSR(productId: string): Promise<ProductDetailSSRResult> {
  try {
    const currentProduct = await getProduct(productId);

    const response = await getProducts({ category2: currentProduct.category2, limit: "20" });
    const relatedProducts = response.products.filter((product) => product.productId !== productId);

    return {
      currentProduct,
      relatedProducts,
      loading: false,
      error: null,
    };
  } catch (error) {
    const e = error as Error;
    console.error("SSR fetch error:", error);
    return {
      currentProduct: null,
      relatedProducts: [],
      loading: false,
      error: e.message,
    };
  }
}
