import { HomePage, NotFoundPage, ProductDetailPage } from "./pages/index.js";
import { cartStore } from "./stores/cartStore.js";
import { productStore } from "./stores/productStore.js";
import { PRODUCT_ACTIONS } from "./stores/actionTypes.js";
import { uiStore } from "./stores/uiStore.js";
import { route } from "./router/serverRouter.js";
import { router } from "./router/router.js";
import { mockGetProducts, mockGetProduct, loadHomePageData } from "./mocks/mockApi.js";

route.add("/", async ({ query }) => {
  // 서버사이드 라우터에 쿼리 설정
  router.setQuery(query || {});

  const data = await loadHomePageData(query || {});

  const stateToSetup = {
    products: data.products,
    categories: data.categories,
    totalCount: data.totalCount,
    currentProduct: null,
    relatedProducts: [],
    loading: false,
    error: null,
    status: "done",
  };
  productStore.dispatch({ type: PRODUCT_ACTIONS.SETUP, payload: stateToSetup });

  return { status: 200, head: "<title>쇼핑몰 - 홈</title>", html: HomePage(), initialData: stateToSetup };
});

route.add("/product/:id", async ({ params, query }) => {
  // 서버사이드 라우터에 쿼리 설정
  router.setQuery(query || {});

  const product = await mockGetProduct(params.id);
  if (!product) {
    return { status: 404, head: "<title>404</title>", html: NotFoundPage(), initialData: null };
  }

  const relatedProducts = product.category2
    ? (await mockGetProducts({ category2: product.category2, limit: 20, page: 1 })).products.filter(
        (p) => p.productId !== params.id,
      )
    : [];

  const stateToSetup = {
    products: [],
    categories: {},
    totalCount: 0,
    currentProduct: product,
    relatedProducts,
    loading: false,
    error: null,
    status: "done",
  };

  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: stateToSetup,
  });

  return {
    status: 200,
    head: `<title>${product.title} - 쇼핑몰</title>`,
    html: ProductDetailPage(),
    initialData: stateToSetup,
  };
});

export const render = async (url, query) => {
  productStore.dispatch({ type: "RESET" });
  cartStore.dispatch({ type: "RESET" });
  uiStore.dispatch({ type: "RESET" });

  const matchedRoute = route.find(url);

  if (!matchedRoute)
    return {
      status: 404,
      head: "",
      html: NotFoundPage(),
      initialData: null,
    };

  return matchedRoute.handler({ params: matchedRoute.params, query });
};
