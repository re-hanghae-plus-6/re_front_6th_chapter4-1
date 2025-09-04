// 홈페이지 데이터 페칭
export async function prefetchHomePage(query = {}) {
  const { getProducts, getCategories } = await import("../api/productApi.js");
  const { productStore, PRODUCT_ACTIONS } = await import("../stores/index.js");

  const [productsResponse, categories] = await Promise.all([getProducts(query), getCategories()]);

  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: {
      products: productsResponse.products,
      totalCount: productsResponse.pagination.total,
      categories,
      loading: false,
      status: "done",
    },
  });

  const productState = productStore.getState();
  return {
    products: productState.products,
    categories: productState.categories,
    totalCount: productState.totalCount,
    query: query,
  };
}

// 상품 상세 페이지 데이터 페칭
export async function prefetchProductDetail(productId) {
  const { getProduct, getProducts } = await import("../api/productApi.js");
  const { productStore, PRODUCT_ACTIONS, initialProductState } = await import("../stores/index.js");

  const product = await getProduct(productId);

  let relatedProducts = [];
  if (product.category2) {
    const relatedResponse = await getProducts({
      category2: product.category2,
      limit: 20,
      current: 1,
    });
    relatedProducts = relatedResponse.products.filter((p) => p.productId !== productId);
  }

  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: {
      ...initialProductState,
      currentProduct: product,
      relatedProducts,
      loading: false,
      status: "done",
    },
  });

  const productState = productStore.getState();
  return {
    product: productState.currentProduct,
    relatedProducts: productState.relatedProducts,
  };
}

// 기본 초기 상태 반환
export async function getDefaultInitialState() {
  const { initialProductState } = await import("../stores/index.js");
  return {
    products: initialProductState.products,
    totalCount: initialProductState.totalCount,
    categories: initialProductState.categories,
  };
}
