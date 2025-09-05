const IS_SERVER = typeof window === "undefined";
const API_ENDPOINT = IS_SERVER ? "http://localhost" : "";

const apiFetch = async (path) => {
  const response = await fetch(`${API_ENDPOINT}${path}`);
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
};

export const getProducts = (params = {}) => {
  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc", page = 1 } = params;

  const query = new URLSearchParams({
    page: params.current || page,
    limit,
    _sort: sort,
  });

  if (search) query.set("q", search);
  if (category1) query.set("category1", category1);
  if (category2) query.set("category2", category2);

  return apiFetch(`/api/products?${query}`);
};

export const getProduct = (productId) => {
  if (!productId) throw new Error("Product ID is required.");
  return apiFetch(`/api/products/${productId}`);
};

export const getCategories = () => {
  return apiFetch("/api/categories");
};
