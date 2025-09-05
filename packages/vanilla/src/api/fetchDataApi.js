import { getProduct, getProducts, getCategories } from "./productApi.js";

export async function retrieveProducts(queryParameters) {
  let productList = [];
  let categoryMap = {};
  let totalProductCount = 0;
  let hasError = null;
  let isLoadingData = true;

  try {
    const [productsResponse, categoriesResponse] = await Promise.all([
      getProducts({ ...queryParameters }),
      getCategories(),
    ]);

    productList = productsResponse.products;
    categoryMap = categoriesResponse;
    totalProductCount = productsResponse.pagination.total;
    hasError = null;
  } catch (fetchError) {
    console.error("Error fetching product data for SSR:", fetchError);
    hasError = fetchError.message;
  } finally {
    isLoadingData = false;
  }

  return {
    products: productList,
    categories: categoryMap,
    totalCount: totalProductCount,
    loading: isLoadingData,
    error: hasError,
  };
}

export async function retrieveProductDetails(targetProductId) {
  let mainProductDetails = null;
  let relatedProductList = [];
  let hasError = null;
  let isLoadingData = true;

  try {
    mainProductDetails = await getProduct(targetProductId);

    const relatedProductsFetch = await getProducts({
      category2: mainProductDetails.category2,
      limit: 20,
    });
    relatedProductList = relatedProductsFetch.products.filter((item) => item.productId !== targetProductId);
    hasError = null;
  } catch (fetchError) {
    console.error("Error fetching product details for SSR:", fetchError);
    hasError = fetchError.message;
  } finally {
    isLoadingData = false;
  }

  return {
    currentProduct: mainProductDetails,
    relatedProducts: relatedProductList,
    loading: isLoadingData,
    error: hasError,
  };
}
