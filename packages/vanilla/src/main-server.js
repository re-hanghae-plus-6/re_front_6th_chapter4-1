import { getProducts, getCategories, getProduct } from "./api/routes.js";
import { ServerRouter } from "./router/serverRouter.js";
import { ServerHomePage } from "./pages/server/ServerHomePage.js";
import { ServerProductDetailPage } from "./pages/server/ServerProductDetailPage.js";

const serverRouter = new ServerRouter();

serverRouter.addRoute("/", async (params, query) => {
  // 쿼리 파라미터 정리 (숫자 변환 포함)
  const cleanQuery = {
    search: query.search || "",
    category1: query.category1 || "",
    category2: query.category2 || "",
    sort: query.sort || "price_asc",
    limit: parseInt(query.limit) || 20,
  };

  const [productsData, categories] = await Promise.all([getProducts(cleanQuery), getCategories()]);

  return {
    type: "homepage",
    data: {
      products: productsData.products,
      pagination: productsData.pagination,
      filters: cleanQuery, // 정리된 쿼리를 filters로 전달
      categories,
    },
  };
});

serverRouter.addRoute("/product/:id/", async (params) => {
  const product = await getProduct(params.id);

  if (!product) {
    return {
      type: "404",
      data: { message: "Product not found" },
    };
  }

  // 관련 상품 로드 (같은 카테고리의 다른 상품들)
  const relatedProducts = await getProducts({
    category1: product.category1,
    category2: product.category2,
    limit: 20,
  });

  // 현재 상품은 관련 상품에서 제외
  const filteredRelatedProducts = relatedProducts.products.filter(
    (relatedProduct) => relatedProduct.productId !== product.productId,
  );

  return {
    type: "product-detail",
    data: {
      currentProduct: product,
      relatedProducts: filteredRelatedProducts.slice(0, 20), // 최대 20개
    },
  };
});

serverRouter.addRoute("/404", async () => {
  return {
    type: "404",
    data: { message: "Page not found" },
  };
});

export const render = async (url) => {
  try {
    // 1. 라우트 매칭
    const route = serverRouter.findRoute(url);

    if (!route) {
      const notFoundRoute = serverRouter.findRoute("/404");
      const result = await notFoundRoute.handler({}, {});

      return {
        html: `<div id="app">
          <div class="min-h-screen bg-gray-50 flex items-center justify-center">
            <div class="text-center">
              <h1 class="text-2xl font-bold text-gray-900 mb-2">404 - Page Not Found</h1>
              <p class="text-gray-600 mb-4">${result.data.message}</p>
              <a href="/" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">홈으로</a>
            </div>
          </div>
        </div>`,
        head: "<title>404 - Page Not Found</title>",
        initialData: result.data,
      };
    }

    // 2. 데이터 프리페칭
    const result = await route.handler(route.params, route.query);

    // 3. 실제 컴포넌트 렌더링
    let html, title;

    let initialData;

    switch (result.type) {
      case "homepage":
        html = `<div id="app">${ServerHomePage({
          products: result.data.products,
          categories: result.data.categories,
          query: result.data.filters,
          totalCount: result.data.pagination.total,
        })}</div>`;
        title = "쇼핑몰 - 홈";
        initialData = {
          products: result.data.products,
          categories: result.data.categories,
          totalCount: result.data.pagination.total,
        };
        break;

      case "product-detail":
        html = `<div id="app">${ServerProductDetailPage({
          product: result.data.currentProduct,
          relatedProducts: result.data.relatedProducts || [],
        })}</div>`;
        title = `${result.data.currentProduct.title} - 쇼핑몰`;
        initialData = {
          currentProduct: result.data.currentProduct,
        };
        break;

      default:
        html = `<div id="app">
          <div class="min-h-screen bg-gray-50 flex items-center justify-center">
            <div class="text-center">
              <h1 class="text-2xl font-bold text-gray-900 mb-2">404 - Page Not Found</h1>
              <p class="text-gray-600 mb-4">${result.data.message}</p>
              <a href="/" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">홈으로</a>
            </div>
          </div>
        </div>`;
        title = "404 - Page Not Found";
        initialData = { error: result.data.message };
    }

    return {
      html,
      head: `<title>${title}</title>`,
      initialData,
    };
  } catch (error) {
    console.error("Server rendering error:", error);

    return {
      html: `<div id="app">
        <div class="min-h-screen bg-gray-50 flex items-center justify-center">
          <div class="text-center">
            <h1 class="text-2xl font-bold text-gray-900 mb-2">Server Error</h1>
            <p class="text-gray-600 mb-4">Something went wrong.</p>
            <p class="text-sm text-red-600">${error.message}</p>
            <a href="/" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mt-4 inline-block">홈으로</a>
          </div>
        </div>
      </div>`,
      head: "<title>Server Error</title>",
      initialData: { error: "Server rendering failed" },
    };
  }
};
