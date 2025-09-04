import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { App } from "./App";
import { createServerRouter } from "./router/createRouter";
import { HomePage, ProductDetailPage, NotFoundPage } from "./pages";
import { productStore, PRODUCT_ACTIONS } from "./entities/products/productStore";
import { fetchProductDataSSR, fetchProductsDataSSR } from "./api/ssr-api";
export const render = async (url: string, query: Record<string, string>) => {
  const router = createServerRouter();

  // 라우트 설정
  router.addRoute("/", HomePage);
  router.addRoute("/product/:id/", ProductDetailPage);
  router.addRoute(".*", NotFoundPage);

  // 서버에서 쿼리 파라미터 설정
  router.push(url);
  router.query = query;

  let initialData = null;
  let pageTitle = "쇼핑몰";

  console.log("url", url);
  console.log("=== 라우트 분기 직전 상태 ===");
  console.log("router.route:", router.route);
  console.log("router.route?.path:", router.route?.path);
  console.log("router.params:", router.params);

  if (router.route?.path === "/") {
    initialData = await fetchProductsDataSSR(query);
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: initialData,
    });
    pageTitle = "쇼핑몰 - 홈";
  } else if (router.route?.path === "/product/:id/" && router.params.id) {
    initialData = await fetchProductDataSSR(router.params.id);
    console.log("initialData", initialData);
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: initialData,
    });

    pageTitle = initialData?.currentProduct?.title
      ? `${initialData.currentProduct.title} - 쇼핑몰`
      : "상품 상세 - 쇼핑몰";
  } else {
    pageTitle = "404 - 쇼핑몰";
  }

  // 잠시 대기 후 렌더링 (스토어 상태가 안정화되도록)
  await new Promise((resolve) => setTimeout(resolve, 10));

  const html = renderToString(
    <StrictMode>
      <App router={router} />
    </StrictMode>,
  );

  return {
    head: `<title>${pageTitle}</title>
    <meta name="description" content="최고의 쇼핑몰에서 다양한 상품을 만나보세요" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />`,
    html,
    initialData,
  };
};
