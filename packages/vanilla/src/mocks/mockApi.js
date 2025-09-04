import items from "./items.json";

export function getUniqueCategories() {
  const categories = {};
  items.forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;
    if (!categories[cat1]) categories[cat1] = {};
    if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {};
  });
  return categories;
}

export function filterProducts(products, query) {
  const searchApplied = query.search
    ? products.filter(
        (item) =>
          item.title.toLowerCase().includes(query.search.toLowerCase()) ||
          item.brand.toLowerCase().includes(query.search.toLowerCase()),
      )
    : products;

  const category1Applied = query.category1
    ? searchApplied.filter((item) => item.category1 === query.category1)
    : searchApplied;

  const category2Applied = query.category2
    ? category1Applied.filter((item) => item.category2 === query.category2)
    : category1Applied;

  const sorted = (() => {
    if (!query.sort) return category2Applied;
    switch (query.sort) {
      case "price_asc":
        return [...category2Applied].sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
      case "price_desc":
        return [...category2Applied].sort((a, b) => parseInt(b.lprice) - parseInt(a.lprice));
      case "name_asc":
        return [...category2Applied].sort((a, b) => a.title.localeCompare(b.title, "ko"));
      case "name_desc":
        return [...category2Applied].sort((a, b) => b.title.localeCompare(a.title, "ko"));
      default:
        return [...category2Applied].sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
    }
  })();

  return sorted;
}

export async function mockGetProducts(query = {}) {
  const normalized = {
    page: Number(query?.page ?? query?.current ?? 1),
    limit: Number(query?.limit ?? 20),
    search: query?.search ?? "",
    category1: query?.category1 ?? "",
    category2: query?.category2 ?? "",
    sort: query?.sort ?? "price_asc",
  };

  const filteredProducts = filterProducts(items, normalized);

  const uptoEnd = Math.min(filteredProducts.length, normalized.page * normalized.limit);
  const productsForResponse = filteredProducts.slice(0, uptoEnd);

  return {
    products: productsForResponse,
    pagination: {
      page: normalized.page,
      limit: normalized.limit,
      total: filteredProducts.length,
      totalPages: Math.ceil(filteredProducts.length / normalized.limit),
      hasNext: uptoEnd < filteredProducts.length,
      hasPrev: normalized.page > 1,
    },
  };
}

export async function mockGetProduct(id) {
  const product = items.find((item) => item.productId === id);
  if (!product) return null;

  return {
    ...product,
    description: `${product.title}에 대한 상세 설명입니다.`,
    rating: Math.floor(Math.random() * 2) + 4,
    reviewCount: Math.floor(Math.random() * 1000) + 50,
    stock: Math.floor(Math.random() * 100) + 10,
    images: [product.image, product.image.replace(".jpg", "_2.jpg"), product.image.replace(".jpg", "_3.jpg")],
  };
}

export async function mockGetCategories() {
  const categories = getUniqueCategories();
  return categories;
}
