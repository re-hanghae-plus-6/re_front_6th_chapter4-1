import items from "./items.json" with { type: "json" };
import type { Categories, Product } from "../entities";

type Query = Record<string, string | number | undefined>;

export interface HomePageData {
  products: Product[];
  categories: Categories;
  totalCount: number;
}

export interface ProductDetailData {
  currentProduct: Product;
  relatedProducts: Product[];
}

function getUniqueCategories(): Categories {
  const categories: Categories = {};
  (items as unknown as Product[]).forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;
    if (!categories[cat1]) categories[cat1] = {} as never;
    if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {} as never;
  });
  return categories;
}

function filterProducts(list: Product[], query: Query) {
  let filtered = [...list];

  const search = (query.search as string) || "";
  if (search) {
    const term = search.toLowerCase();
    filtered = filtered.filter(
      (item) => item.title.toLowerCase().includes(term) || item.brand.toLowerCase().includes(term),
    );
  }

  const category1 = (query.category1 as string) || "";
  if (category1) filtered = filtered.filter((p) => p.category1 === category1);
  const category2 = (query.category2 as string) || "";
  if (category2) filtered = filtered.filter((p) => p.category2 === category2);

  const sort = (query.sort as string) || "price_asc";
  switch (sort) {
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

  return filtered;
}

export async function loadHomePageData(query: Query): Promise<HomePageData> {
  const page = Number(query.page ?? query.current ?? 1);
  const limit = Number(query.limit ?? 20);
  const filtered = filterProducts(items as unknown as Product[], query);

  const start = (page - 1) * limit;
  const end = start + limit;
  const products = filtered.slice(start, end);
  const categories = getUniqueCategories();

  return { products, categories, totalCount: filtered.length };
}

export async function loadProductDetailData(productId: string): Promise<ProductDetailData | null> {
  const product = (items as unknown as Product[]).find((p) => p.productId === productId);
  if (!product) return null;
  const relatedPool = (items as unknown as Product[]).filter(
    (p) => p.category2 && p.category2 === product.category2 && p.productId !== productId,
  );
  const relatedProducts = relatedPool.slice(0, 20);
  return { currentProduct: product as Product, relatedProducts };
}
