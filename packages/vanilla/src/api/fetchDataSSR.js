import { getProducts, getProduct, getCategories } from "./productApi.js";

export async function fetchProductsDataSSR(query = {}) {
  const [productsResponse, categories] = await Promise.all([getProducts(query), getCategories()]);

  return {
    products: productsResponse.products,
    categories,
    totalCount: productsResponse.pagination.total,
    loading: false,
    status: "done",
  };
}

export async function fetchProductDataSSR(productId) {
  try {
    const product = await getProduct(productId);

    // 관련 상품 로드
    const relatedProductsResponse = await getProducts({
      category2: product.category2,
      limit: 20,
    });

    const relatedProducts = relatedProductsResponse.products.filter((p) => p.productId !== productId).slice(0, 20);

    return {
      currentProduct: product,
      relatedProducts,
      loading: false,
      error: null,
    };
  } catch (error) {
    console.error(`상품 ${productId} 로드 실패:`, error);
    return {
      currentProduct: null,
      relatedProducts: [],
      loading: false,
      error: error.message,
    };
  }
}
