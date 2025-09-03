import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { App } from "./App";
import { createServerRouter } from "./router/createRouter";
import { HomePage, ProductDetailPage, NotFoundPage } from "./pages";
import { fetchProductDataSSR, fetchProductsDataSSR } from "./api/ssr-api";
export const render = async (url: string, query: Record<string, string>) => {
  const router = createServerRouter();

  // 라우트 설정
  router.addRoute("/", HomePage);
  router.addRoute("/product/:id/", ProductDetailPage);
  router.addRoute(".*", NotFoundPage);

  // 서버에서 URL 설정 및 라우터 시작
  router.push(url);

  let initialData = null;
  if (router.route?.path === "/") {
    initialData = await fetchProductsDataSSR(query);
  } else if (router.route?.path === "/product/:id/" && router.params.id) {
    initialData = await fetchProductDataSSR(router.params.id);
  }
  const html = renderToString(
    <StrictMode>
      <App router={router} />
    </StrictMode>,
  );

  return {
    head: `<title>ssr test</title>`,
    html,
    initialData: initialData,
  };
};
