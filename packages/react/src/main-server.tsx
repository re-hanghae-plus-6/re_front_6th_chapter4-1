import { StrictMode } from "react";
import { renderToString } from "react-dom/server";
import { App } from "./App";
import { createServerRouter } from "./router/createRouter";
import { HomePage, ProductDetailPage, NotFoundPage } from "./pages";

export const render = async (url: string, query: Record<string, string>) => {
  const router = createServerRouter(url);
  console.log({ url, query });
  // 라우트 설정
  router.addRoute("/", HomePage);
  router.addRoute("/product/:id/", ProductDetailPage);
  router.addRoute(".*", NotFoundPage);

  const html = renderToString(
    <StrictMode>
      <App router={router} />
    </StrictMode>,
  );
  return { html };
};
