// 서버 환경에서 사용할 baseUrl 생성
function getServerBaseUrl() {
  if (typeof window !== "undefined") {
    return ""; // 클라이언트 환경에서는 빈 문자열
  }

  // 서버 환경: NODE_ENV에 따라 포트 결정
  const port = process.env.NODE_ENV === "production" ? "4174" : "5174";
  return `http://localhost:${port}`;
}

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

  const baseUrl = getServerBaseUrl();
  const response = await fetch(`${baseUrl}/api/products?${searchParams}`);

  return await response.json();
}

export async function getProduct(productId) {
  const baseUrl = getServerBaseUrl();
  const response = await fetch(`${baseUrl}/api/products/${productId}`);
  return await response.json();
}

export async function getCategories() {
  const baseUrl = getServerBaseUrl();
  const response = await fetch(`${baseUrl}/api/categories`);
  return await response.json();
}
