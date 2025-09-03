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

  // 서버 환경에서는 절대 URL 사용
  const baseUrl = typeof window === "undefined" ? "http://localhost:5174" : "";
  const response = await fetch(`${baseUrl}/api/products?${searchParams}`);

  return await response.json();
}

export async function getProduct(productId) {
  // 서버 환경에서는 절대 URL 사용
  const baseUrl = typeof window === "undefined" ? "http://localhost:5174" : "";
  const response = await fetch(`${baseUrl}/api/products/${productId}`);
  return await response.json();
}

export async function getCategories() {
  // 서버 환경에서는 절대 URL 사용
  const baseUrl = typeof window === "undefined" ? "http://localhost:5174" : "";
  const response = await fetch(`${baseUrl}/api/categories`);
  return await response.json();
}
