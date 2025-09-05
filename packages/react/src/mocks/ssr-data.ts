import items from "../mocks/items.json" with { type: "json" };
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

// 상품 목록 필터링
function filterProducts(products: Product[], query: StringRecord): Product[] {
  let filtered = [...products];

  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(
      (item) => item.title.toLowerCase().includes(searchTerm) || item.brand.toLowerCase().includes(searchTerm),
    );
  }

  if (query.category1) {
    filtered = filtered.filter((item) => item.category1 === query.category1);
  }
  if (query.category2) {
    filtered = filtered.filter((item) => item.category2 === query.category2);
  }

  if (query.sort) {
    switch (query.sort) {
      case "price_asc":
        filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
        break;
      case "price_desc":
        filtered.sort((a, b) => parseInt(b.lprice) - parseInt(a.lprice));
        break;
      case "name_asc":
        filtered.sort((a, b) => a.title.localeCompare(b.title, "ko"));
        break;
      case "name_desc":
        filtered.sort((a, b) => b.title.localeCompare(a.title, "ko"));
        break;
      default:
        filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
    }
  }

  return filtered;
}

// 상품 목록 조회
export async function getProducts(params: StringRecord = {}): Promise<ProductsResponse> {
  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
  const page = params.current ?? params.page ?? 1;

  const filteredProducts = filterProducts(items, { search, category1, category2, sort });

  const startIndex = (Number(page) - 1) * Number(limit);
  const endIndex = startIndex + Number(limit);
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  return {
    products: paginatedProducts,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: filteredProducts.length,
      totalPages: Math.ceil(filteredProducts.length / Number(limit)),
      hasNext: endIndex < filteredProducts.length,
      hasPrev: Number(page) > 1,
    },
    filters: { search, category1, category2, sort },
  };
}

// 상품 상세 조회
export async function getProduct(productId: string): Promise<Product> {
  const product = items.find((item) => item.productId === productId);
  if (!product) throw new Error("Product not found");
  return product;
}

// 카테고리 목록 조회
export async function getCategories(): Promise<Categories> {
  const categories: Categories = {};
  items.forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;
    if (!categories[cat1]) categories[cat1] = {};
    if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {};
  });
  return categories;
}
