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
import { PRODUCT_ACTIONS, productStore } from "./entities";
import { QueryProvider } from "./contexts/QueryContext";

router.addRoute("/", HomePage);
router.addRoute("/product/:id/", ProductDetailPage);
router.addRoute("*", NotFoundPage);

export const render = async (url: string) => {
  const matched = (router as MemoryRouter<FunctionComponent>).match(url);

  console.log("👉 matched", matched);
  if (!matched) {
    return {
      head: "<title>404</title>",
      html: NotFoundPage(),
      initialData: null,
    };
  }

  const { path, params, component, query } = matched;
  console.log("👉 path", path);
  console.log("👉 params", params);
  console.log("👉 component", component);
  let initialData;
  let pageTitle;
  const PageComponent = component as FunctionComponent<{
    initialData?: ProductsSSRResult | ProductDetailSSRResult | null;
  }>;

  if (path === "/") {
    initialData = await fetchProductsDataSSR(query);
    pageTitle = "쇼핑몰 - 홈";

    // ✅ 서버 스토어 주입
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        products: initialData.products,
        categories: initialData.categories,
        totalCount: initialData.totalCount,
        loading: false,
        status: "done",
        error: null,
      },
    });
  } else if (path === "/product/:id/") {
    initialData = await fetchProductDataSSR(params.id);
    console.log("✅ 상세페이지 데이터", initialData);
    pageTitle = initialData?.currentProduct?.title ? `${initialData?.currentProduct?.title} - 쇼핑몰` : "쇼핑몰";

    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
      payload: initialData.currentProduct,
    });

    if (initialData.relatedProducts) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
        payload: initialData.relatedProducts,
      });
    }
  }

  return {
    head: `<title>${pageTitle}</title>`,
    html: renderToString(
      <QueryProvider initialQuery={query}>
        <PageComponent />
      </QueryProvider>,
    ),
    initialData: {
      ...initialData,
      query,
    },
  };
};
