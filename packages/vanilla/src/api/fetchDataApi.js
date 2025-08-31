import items from "../mocks/items.json";

/**
 * 카테고리 추출
 */
function getUniqueCategories() {
  const categories = {};

  items.forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;
    if (!categories[cat1]) categories[cat1] = {};
    if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {};
  });

  return categories;
}

/**
 * 상품 필터링
 */
function filterProducts(products, query) {
  let filtered = [...products];

  if (query.search) {
    const term = query.search.toLowerCase();
    filtered = filtered.filter(
      (item) => item.title.toLowerCase().includes(term) || item.brand.toLowerCase().includes(term),
    );
  }

  if (query.category1) {
    filtered = filtered.filter((p) => p.category1 === query.category1);
  }
  if (query.category2) {
    filtered = filtered.filter((p) => p.category2 === query.category2);
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
    }
  }

  return filtered;
}

/**
 * SSR 전용 데이터 fetch 함수
 */
export async function fetchDataApi(path, query = {}, params = {}) {
  try {
    if (path === "/") {
      const filteredProducts = filterProducts(items, query);
      const limit = query.limit ?? 20;
      const page = query.page ?? 1;
      const startIndex = (page - 1) * limit;
      const paginated = filteredProducts.slice(startIndex, startIndex + limit);

      return {
        products: paginated,
        totalCount: filteredProducts.length,
        categories: getUniqueCategories(),
      };
    }

    if (path === "/products/:id/") {
      const product = items.find((item) => item.productId === params.id);
      if (!product) return null;

      const related = items
        .filter((p) => p.category2 === product.category2 && p.productId !== product.productId)
        .slice(0, 4);

      return {
        currentProduct: product,
        relatedProducts: related,
      };
    }

    return null;
  } catch (e) {
    console.error("SSR error:", e);
    return null;
  }
}
