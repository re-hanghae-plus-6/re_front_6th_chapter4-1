import { getProduct, getProducts, getCategories } from "./productApi.js";

export async function fetchProductsDataSSR(query) {
  try {
    const [productsData, categories] = await Promise.all([getProducts({ ...query }), getCategories()]);

    return {
      products: productsData.products,
      categories,
      totalCount: productsData.pagination.total,
      loading: false,
      error: null,
    };
  } catch (error) {
    console.error("SSR fetch error:", error);
    return {
      products: [],
      categories: {},
      totalCount: 0,
      loading: false,
      error: error.message,
    };
  }
}

export async function fetchProductDataSSR(productId) {
  try {
    const currentProduct = await getProduct(productId);

    const response = await getProducts({ category2: currentProduct.category2, limit: 20 });
    const relatedProducts = response.products.filter((product) => product.productId !== productId);

    return {
      currentProduct,
      relatedProducts,
      loading: false,
      error: null,
    };
  } catch (error) {
    console.error("SSR fetch error:", error);
    return {
      currentProduct: null,
      relatedProducts: [],
      loading: false,
      error: error.message,
    };
  }
}
