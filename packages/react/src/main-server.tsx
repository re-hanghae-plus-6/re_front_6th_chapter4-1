import type { MemoryRouter } from "@hanghae-plus/lib";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { router } from "./router";
import type { FunctionComponent } from "react";
import {
  fetchProductDataSSR,
  fetchProductsDataSSR,
  type ProductDetailSSRResult,
  type ProductsSSRResult,
} from "./api/ssrProductApi";
import { renderToString } from "react-dom/server";

router.addRoute("/", HomePage);
router.addRoute("/product/:id/", ProductDetailPage);
router.addRoute("*", NotFoundPage);

export const render = async (url: string, query: Record<string, string>) => {
  const matched = (router as MemoryRouter<FunctionComponent>).match(url);

  console.log("👉 matched", matched);
  if (!matched) {
    return {
      head: "<title>404</title>",
      html: NotFoundPage(),
      initialData: null,
    };
  }

  const { path, params, component } = matched;

  let initialData;
  let pageTitle;
  const PageComponent = component as FunctionComponent<{
    initialData?: ProductsSSRResult | ProductDetailSSRResult | null;
  }>;

  if (path === "/") {
    initialData = await fetchProductsDataSSR(query);

    pageTitle = "쇼핑몰 - 홈";
  } else if (path === "/product/:id") {
    initialData = await fetchProductDataSSR(params.id);

    pageTitle = initialData?.currentProduct?.title ? `${initialData?.currentProduct?.title} - 쇼핑몰` : "쇼핑몰";
  }

  return {
    head: `<title>${pageTitle}</title>`,
    html: renderToString(<PageComponent initialData={initialData} />),
    initialData,
  };
};
