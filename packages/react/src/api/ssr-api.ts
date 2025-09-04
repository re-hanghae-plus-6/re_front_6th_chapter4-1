import { getProductsServer, getProductServer, getCategoriesServer } from "./server-api";

export async function fetchProductsDataSSR(query = {}) {
  const productsResponse = getProductsServer(query);
  const categories = getCategoriesServer();

  return {
    products: productsResponse.products,
    categories,
    totalCount: productsResponse.pagination.total,
    loading: false,
    status: "done",
    // 쿼리 정보도 포함
    query: productsResponse.filters,
  };
}

export async function fetchProductDataSSR(productId: string) {
  const product = getProductServer(productId);
  const relatedProductsResponse = getProductsServer({
    category2: product.category2,
    limit: "20",
  });

  const relatedProducts = relatedProductsResponse.products.filter((p) => p.productId !== productId).slice(0, 20);

  return {
    currentProduct: product,
    relatedProducts,
    loading: false,
    error: null,
  };
}
