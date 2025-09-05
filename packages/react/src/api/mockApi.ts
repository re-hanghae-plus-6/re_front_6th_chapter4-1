import type { Categories, Product } from "../entities";
import type { StringRecord } from "../types";
import items from "../mocks/items.json";

function getUniqueCategories(): Categories {
  const categories: Record<string, Record<string, string | StringRecord>> = {};
  (items as unknown as Product[]).forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;
    if (!categories[cat1]) categories[cat1] = {};
    if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {};
  });
  return categories;
}

function filterProducts(products: Product[], query: Record<string, string>) {
  let filtered = [...products];

  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(
      (item) => item.title.toLowerCase().includes(searchTerm) || item.brand.toLowerCase().includes(searchTerm),
    );
  }
  if (query.category1) filtered = filtered.filter((item) => item.category1 === query.category1);
  if (query.category2) filtered = filtered.filter((item) => item.category2 === query.category2);

  switch (query.sort) {
    case "price_desc":
      filtered.sort((a, b) => parseInt(b.lprice) - parseInt(a.lprice));
      break;
    case "name_asc":
      filtered.sort((a, b) => a.title.localeCompare(b.title, "ko"));
      break;
    case "name_desc":
      filtered.sort((a, b) => b.title.localeCompare(a.title, "ko"));
      break;
    case "price_asc":
    default:
      filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
  }
  return filtered;
}

const delay = (ms = 50) => new Promise((r) => setTimeout(r, ms));

export async function getProducts(params: StringRecord = {}) {
  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
  const page = Number(params.current ?? params.page ?? 1);
  const filtered = filterProducts(items as unknown as Product[], { search, category1, category2, sort });
  const start = (page - 1) * Number(limit);
  const end = start + Number(limit);
  const products = filtered.slice(start, end);
  await delay();
  return {
    products,
    pagination: {
      page,
      limit: Number(limit),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / Number(limit)),
      hasNext: end < filtered.length,
      hasPrev: page > 1,
    },
    filters: { search, category1, category2, sort },
  };
}

export async function getProduct(productId: string): Promise<Product> {
  await delay();
  const product = (items as unknown as Product[]).find((i) => i.productId === productId);
  if (!product) throw new Error("Product not found");
  return {
    ...product,
    description: `${product.title}에 대한 상세 설명입니다. ${product.brand} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
    rating: Math.floor(Math.random() * 2) + 4,
    reviewCount: Math.floor(Math.random() * 1000) + 50,
    stock: Math.floor(Math.random() * 100) + 10,
    images: [product.image, product.image.replace(".jpg", "_2.jpg"), product.image.replace(".jpg", "_3.jpg")],
  } as Product;
}

export async function getCategories(): Promise<Categories> {
  await delay();
  return getUniqueCategories();
}
