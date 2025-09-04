import { renderToString } from "react-dom/server";
import { createElement } from "react";
import { route } from "./router/serverRouter";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { loadHomePageData, loadProductDetailData } from "./mocks/mockApi";
import { productStore, PRODUCT_ACTIONS } from "./entities/products/productStore";

route.add("/", HomePage);
route.add("/product/:id", ProductDetailPage);

export const render = async (url: string, query: Record<string, string>) => {
  const matchedRoute = route.find(url);
  if (!matchedRoute) {
    return {
      status: 404,
      head: "<title>404</title>",
      html: renderToString(createElement(NotFoundPage)),
      initialData: null,
    };
  }

  if (matchedRoute.params.id) {
    const id = matchedRoute.params.id;
    const detail = await loadProductDetailData(id);
    if (!detail) {
      return {
        status: 404,
        head: "<title>404</title>",
        html: renderToString(createElement(NotFoundPage)),
        initialData: null,
      };
    }
    productStore.dispatch({ type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT, payload: detail.currentProduct });
    productStore.dispatch({ type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS, payload: detail.relatedProducts });
    const html = renderToString(createElement(matchedRoute.handler));
    return {
      status: 200,
      head: "<title>상품 상세 - React 쇼핑몰</title>",
      html,
      initialData: detail,
    };
  }

  const initialData = await loadHomePageData(query || {});
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: {
      products: initialData.products,
      categories: initialData.categories,
      totalCount: initialData.totalCount,
      loading: false,
      status: "done",
    },
  });
  const html = renderToString(createElement(matchedRoute.handler));
  return {
    status: 200,
    head: "<title>React 쇼핑몰 - 홈</title>",
    html,
    initialData,
  };
};
