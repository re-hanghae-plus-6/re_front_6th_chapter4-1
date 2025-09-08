import { isServer } from "../utils";

const withBaseUrl = (url) => {
  return isServer ? new URL(url, `http://localhost:${process.env.PORT}`) : url;
};

export async function getProducts(params = {}) {
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

  const response = await fetch(withBaseUrl(`/api/products?${searchParams}`));

  return await response.json();
}

export async function getProduct(productId) {
  const response = await fetch(withBaseUrl(`/api/products/${productId}`));
  return await response.json();
}

export async function getCategories() {
  const response = await fetch(withBaseUrl("/api/categories"));
  return await response.json();
}
