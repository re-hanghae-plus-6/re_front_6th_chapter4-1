import { isServer } from "../utils/runtime.js";
import fs from "node:fs";
import path from "node:path";

// 서버 환경에서 items.json 데이터 로드
let items = [];
if (isServer) {
  try {
    const itemsPath = path.join(process.cwd(), "src/mocks/items.json");
    items = JSON.parse(fs.readFileSync(itemsPath, "utf-8"));
  } catch (error) {
    console.error("items.json 로드 실패:", error);
    items = [];
  }
}

const withBaseUrl = (url) => {
  return isServer ? new URL(url, `http://localhost`) : url;
};

export async function getProducts(params = {}) {
  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
  const page = params.current ?? params.page ?? 1;

  // 서버 환경에서는 items.json 데이터 사용
  if (isServer) {
    let filteredProducts = [...items];

    if (search) {
      filteredProducts = filteredProducts.filter((p) => p.title.toLowerCase().includes(search.toLowerCase()));
    }

    if (category1) {
      filteredProducts = filteredProducts.filter((p) => p.category1 === category1);
    }

    if (category2) {
      filteredProducts = filteredProducts.filter((p) => p.category2 === category2);
    }

    // 정렬
    if (sort) {
      switch (sort) {
        case "price_asc":
          filteredProducts.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
          break;
        case "price_desc":
          filteredProducts.sort((a, b) => parseInt(b.lprice) - parseInt(a.lprice));
          break;
        case "name_asc":
          filteredProducts.sort((a, b) => a.title.localeCompare(b.title, "ko"));
          break;
        case "name_desc":
          filteredProducts.sort((a, b) => b.title.localeCompare(a.title, "ko"));
          break;
        default:
          filteredProducts.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
      }
    }

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    return {
      products: paginatedProducts,
      pagination: {
        total: filteredProducts.length,
        page,
        limit,
        totalPages: Math.ceil(filteredProducts.length / limit),
        hasNext: endIndex < filteredProducts.length,
        hasPrev: page > 1,
      },
    };
  }

  // 클라이언트 환경에서는 기존 로직 사용
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(category1 && { category1 }),
    ...(category2 && { category2 }),
    sort,
  });

  const response = await fetch(withBaseUrl(`/api/products?${searchParams}`));
  return await response.json();
}

export async function getProduct(productId) {
  // 서버 환경에서는 items.json 데이터 사용
  if (isServer) {
    const product = items.find((p) => p.productId === productId);
    return product || null;
  }

  // 클라이언트 환경에서는 기존 로직 사용
  const response = await fetch(withBaseUrl(`/api/products/${productId}`));
  return await response.json();
}

export async function getCategories() {
  // 서버 환경에서는 items.json에서 카테고리 추출
  if (isServer) {
    const categories = {};
    items.forEach((item) => {
      const cat1 = item.category1;
      const cat2 = item.category2;
      if (!categories[cat1]) categories[cat1] = {};
      if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {};
    });
    return categories;
  }

  // 클라이언트 환경에서는 기존 로직 사용
  const response = await fetch(withBaseUrl("/api/categories"));
  return await response.json();
}
