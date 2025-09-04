// 서버 환경에서 사용할 기본 URL
const getBaseUrl = () => {
  if (typeof window !== "undefined") {
    return ""; // 브라우저에서는 상대 경로 사용
  }
  const prod = process.env.NODE_ENV === "production";

  return prod ? "http://localhost:4174" : "http://localhost:5174"; // 서버에서는 절대 경로 사용
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

  const response = await fetch(`${getBaseUrl()}/api/products?${searchParams}`);
  return await response.json();
}

export async function getProduct(productId) {
  const response = await fetch(`${getBaseUrl()}/api/products/${productId}`);
  return await response.json();
}

export async function getCategories() {
  const response = await fetch(`${getBaseUrl()}/api/categories`);
  return await response.json();
}
