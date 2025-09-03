import { mockGetProducts, mockGetCategories, mockGetProduct } from "./api/mockApi.js";
import { ServerRouter } from "./router/serverRouter.js";

const serverRouter = new ServerRouter();

serverRouter.addRoute("/", async (params, query) => {
  const [productsData, categories] = await Promise.all([
    mockGetProducts({ ...query, limit: query.limit || 20 }),
    mockGetCategories(),
  ]);

  return {
    type: "homepage",
    data: {
      products: productsData.products,
      pagination: productsData.pagination,
      filters: productsData.filters,
      categories,
    },
  };
});

serverRouter.addRoute("/product/:id/", async (params) => {
  const product = await mockGetProduct(params.id);

  if (!product) {
    return {
      type: "404",
      data: { message: "Product not found" },
    };
  }

  return {
    type: "product-detail",
    data: {
      currentProduct: product,
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
        html: '<div id="app"><h1>404 - Page Not Found</h1></div>',
        head: "<title>404 - Page Not Found</title>",
        initialData: result.data,
      };
    }

    // 2. 데이터 프리페칭
    const result = await route.handler(route.params, route.query);

    // 3. HTML 및 메타데이터 생성 (현재는 간단한 형태)
    let html, title;

    switch (result.type) {
      case "homepage":
        html = `<div id="app">
          <h1>Shopping Mall</h1>
          <p>Products loaded: ${result.data.products.length}</p>
          <p>Total products: ${result.data.pagination.total}</p>
        </div>`;
        title = "Shopping Mall - Home";
        break;

      case "product-detail":
        html = `<div id="app">
          <h1>${result.data.currentProduct.title}</h1>
          <p>Price: ${result.data.currentProduct.lprice}원</p>
          <p>Brand: ${result.data.currentProduct.brand}</p>
        </div>`;
        title = `${result.data.currentProduct.title} - Shopping Mall`;
        break;

      default:
        html = `<div id="app">
          <h1>404 - Page Not Found</h1>
          <p>${result.data.message}</p>
        </div>`;
        title = "404 - Page Not Found";
    }

    return {
      html,
      head: `<title>${title}</title>`,
      initialData: result.data,
    };
  } catch (error) {
    console.error("Server rendering error:", error);

    return {
      html: '<div id="app"><h1>Server Error</h1><p>Something went wrong.</p></div>',
      head: "<title>Server Error</title>",
      initialData: { error: "Server rendering failed" },
    };
  }
};
