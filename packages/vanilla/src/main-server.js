import { HomePage, ProductDetailPage, NotFoundPage } from "./pages";
import { fetchProductDataSSR, fetchProductsDataSSR } from "./api/fetchDataSSR.js";
import { ServerRouter } from "./lib/ServerRouter.js";

export async function render(url, query = {}) {
  const router = new ServerRouter();
  router.addRoute("/", HomePage);
  router.addRoute("/product/:id/", ProductDetailPage);
  const matched = router.match(url);

  if (!matched) {
    return {
      head: "<title>404</title>",
      html: NotFoundPage(),
      initialData: null,
    };
  }

  const { path, params } = matched;

  let initialData;

  if (path === "/") {
    initialData = await fetchProductsDataSSR(query);
  } else if (path === "/product/:id/") {
    initialData = await fetchProductDataSSR(params.id);
  }

  let pageTitle;
  let pageHtml;

  if (path === "/") {
    pageTitle = "쇼핑몰 - 홈";
    pageHtml = HomePage(url, query, initialData);
  } else if (path === "/product/:id/") {
    pageTitle = initialData?.currentProduct?.title ? `${initialData?.currentProduct?.title} - 쇼핑몰` : "쇼핑몰";
    pageHtml = ProductDetailPage(initialData);
  } else {
    pageHtml = NotFoundPage();
  }

  return {
    head: `<title>${pageTitle}</title>`,
    html: pageHtml,
    initialData,
  };
}
