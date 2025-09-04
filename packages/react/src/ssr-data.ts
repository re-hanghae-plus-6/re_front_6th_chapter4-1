// 서버 데이터 로딩 시스템
import items from "./mocks/items.json" with { type: "json" };
import type { Product } from "./entities";

export interface Category {
  [key: string]: {
    [key: string]: {
      [key: string]: {
        [key: string]: Record<string, never>;
      };
    };
  };
}

export interface HomePageData {
  products: Product[];
  categories: Category;
  totalCount: number;
}

export interface ProductDetailData {
  product: Product;
  relatedProducts: Product[];
}

// 카테고리 추출 함수 (handlers.ts에서 가져옴)
function getUniqueCategories(): Category {
  const categories: Category = {};

  items.forEach((item: Product) => {
    if (!categories[item.category1]) {
      categories[item.category1] = {};
    }
    if (!categories[item.category1][item.category2]) {
      categories[item.category1][item.category2] = {};
    }
    if (!categories[item.category1][item.category2][item.category3]) {
      categories[item.category1][item.category2][item.category3] = {};
    }
    if (!categories[item.category1][item.category2][item.category3][item.category4]) {
      categories[item.category1][item.category2][item.category3][item.category4] = {};
    }
  });

  return categories;
}

// 상품 검색 및 필터링 함수 (handlers.ts에서 가져옴)
function filterProducts(products: Product[], query: Record<string, string>): Product[] {
  let filtered = [...products];

  // 검색어 필터링
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter((product) => product.title.toLowerCase().includes(searchTerm));
  }

  // 카테고리 필터링
  if (query.category1) {
    filtered = filtered.filter((product) => product.category1 === query.category1);
  }
  if (query.category2) {
    filtered = filtered.filter((product) => product.category2 === query.category2);
  }
  if (query.category3) {
    filtered = filtered.filter((product) => product.category3 === query.category3);
  }
  if (query.category4) {
    filtered = filtered.filter((product) => product.category4 === query.category4);
  }

  // 정렬
  if (query.sort) {
    switch (query.sort) {
      case "price_asc":
        filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
        break;
      case "price_desc":
        filtered.sort((a, b) => parseInt(b.lprice) - parseInt(a.lprice));
        break;
      case "name_asc":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "name_desc":
        filtered.sort((a, b) => b.title.localeCompare(a.title));
        break;
    }
  }

  return filtered;
}

// 상품 ID로 상품 찾기 (handlers.ts에서 가져옴)
function findProductById(productId: string): Product | undefined {
  return items.find((item: Product) => item.productId === productId);
}

// 관련 상품 가져오기 (handlers.ts에서 가져옴)
function getRelatedProducts(currentProductId: string): Product[] {
  const currentProduct = findProductById(currentProductId);
  if (!currentProduct) return [];

  return items
    .filter((item: Product) => item.productId !== currentProductId && item.category1 === currentProduct.category1)
    .slice(0, 4);
}

export async function loadHomePageData(url: string, query: Record<string, string>): Promise<HomePageData> {
  const filteredProducts = filterProducts(items as Product[], query);
  const categories = getUniqueCategories();

  return {
    products: filteredProducts,
    categories,
    totalCount: filteredProducts.length,
  };
}

export async function loadProductDetailData(productId: string): Promise<ProductDetailData | null> {
  const product = findProductById(productId);
  if (!product) {
    return null;
  }

  const relatedProducts = getRelatedProducts(productId);

  return {
    product,
    relatedProducts,
  };
}
