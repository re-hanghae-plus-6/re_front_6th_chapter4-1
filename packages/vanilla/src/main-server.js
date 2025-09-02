import { ServerRouter } from "./lib/router/ServerRouter.js";
import { prefetchHomePage, prefetchProductDetail, getDefaultInitialState } from "./server/prefetch.js";

async function prefetchData(route, params) {
  if (route.path === "/") {
    return await prefetchHomePage();
  }

  if (route.path === "/product/:id") {
    return await prefetchProductDetail(params.id);
  }

  return await getDefaultInitialState();
}

export const render = async (url, query) => {
  // 서버 라우터에 쿼리 설정
  const { router } = await import("./router/index.js");
  router.query = query || {};

  const serverRouter = new ServerRouter();

  serverRouter.addRoute("/", async () => {
    const { HomePage } = await import("./pages");
    return HomePage();
  });

  serverRouter.addRoute("/product/:id", async () => {
    const { ProductDetailPage } = await import("./pages");
    return ProductDetailPage();
  });

  const route = serverRouter.findRoute(url);

  if (route) {
    const initialState = await prefetchData(route, route.params);

    const html = await route.handler(route.params);

    return {
      html,
      head: "<title>쇼핑몰 - 홈</title>",
      initialState,
    };
  } else {
    const { NotFoundPage } = await import("./pages");
    const { initialProductState } = await import("./stores/index.js");

    return {
      html: NotFoundPage(),
      head: "",
      initialState: {
        products: initialProductState.products,
        totalCount: initialProductState.totalCount,
        categories: initialProductState.categories,
      },
    };
  }
};
