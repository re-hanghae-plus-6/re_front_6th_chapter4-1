import { getDefaultInitialState, prefetchHomePage, prefetchProductDetail } from "./server/prefetch";

async function prefetchData(route, params, query) {
  if (route.path === "/") {
    return await prefetchHomePage(query);
  }

  if (route.path === "/product/:id/") {
    return await prefetchProductDetail(params.id);
  }

  return await getDefaultInitialState();
}

export const render = async (url, query) => {
  const { ServerRouter } = await import("./lib");
  const serverRouter = new ServerRouter();

  serverRouter.addRoute("/", async () => {
    const { HomePage } = await import("./pages");
    // 쿼리를 페이지 컴포넌트에 props로 전달 (외부 query 사용)
    return HomePage({ query });
  });

  serverRouter.addRoute("/product/:id/", async () => {
    const { ProductDetailPage } = await import("./pages");
    // store에 이미 상품 데이터가 저장되어 있으므로 별도 전달 불필요
    return ProductDetailPage();
  });

  const route = serverRouter.findRoute(url);

  if (route) {
    const initialState = await prefetchData(route, route.params, query || {});

    const html = await route.handler(route.params);

    if (route.path === "/") {
      const head = "<title>쇼핑몰 - 홈</title>";

      return {
        html,
        head,
        initialState,
      };
    }

    if (route.path === "/product/:id/") {
      const product = initialState.product;
      const head = product ? `<title>${product.title} - 쇼핑몰</title>` : "<title>상품 상세 - 쇼핑몰</title>";

      return {
        html,
        head,
        initialState,
      };
    }

    // 기타 라우트의 경우 기본 반환
    return {
      html,
      head: "<title>쇼핑몰</title>",
      initialState,
    };
  } else {
    const { NotFoundPage } = await import("./pages");
    const { initialProductState } = await import("./stores");

    return {
      html: NotFoundPage(),
      head: "<title>404 - 페이지를 찾을 수 없습니다</title>",
      initialState: {
        products: initialProductState.products,
        totalCount: initialProductState.totalCount,
        categories: initialProductState.categories,
      },
    };
  }
};
