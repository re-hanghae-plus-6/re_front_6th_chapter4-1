// API 기본 URL 설정
const getApiBaseUrl = async () => {
  if (import.meta.env.SSR) {
    // 서버 환경에서는 절대 URL 사용
    // 개발 환경: 5173, SSR 서버: 5174
    const port = process.env.PORT || 5174;

    return `http://localhost:${port}`;
  } else {
    // 클라이언트 환경에서는 상대 URL 사용
    return "";
  }
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

  const baseUrl = await getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/products?${searchParams}`);

  return await response.json();
}

export async function getProduct(productId) {
  const baseUrl = await getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/products/${productId}`);

  return await response.json();
}

export async function getCategories() {
  const baseUrl = await getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/categories`);
  return await response.json();
}
