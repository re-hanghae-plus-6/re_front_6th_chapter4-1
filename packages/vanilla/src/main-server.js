import { router } from "./router/router.js";
import { fetchDataApi } from "./api/fetchDataApi.js";
import { HomePage, ProductDetailPage, NotFoundPage } from "./pages";

router.addRoute("/", HomePage);
router.addRoute("/products/:id/", ProductDetailPage);

export async function render(url) {
  const matched = router.match(url);

  if (!matched) {
    return {
      head: `<title>404 - Not Found</title>`,
      html: NotFoundPage(),
      initialData: null,
    };
  }

  const { path, params, query } = matched;

  try {
    const initialData = await fetchDataApi(path, query, params);

    let pageHtml;
    let pageTitle;

    if (path === "/") {
      pageTitle = "쇼핑몰 - 홈";
      pageHtml = HomePage({ initialData });
    } else if (path === "/products/:id/") {
      const productName = initialData?.currentProduct?.name ?? "상품 상세";
      pageTitle = `쇼핑몰 - ${productName}`;
      pageHtml = ProductDetailPage();
    } else {
      pageTitle = "404 - Not Found";
      pageHtml = NotFoundPage();
    }

    return {
      head: `<title>${pageTitle}</title>`,
      html: pageHtml,
      initialData,
    };
  } catch (e) {
    console.error("SSR error: ", e);
    return {
      head: `<title>500 - server error</title>`,
      html: NotFoundPage(),
      initialData: null,
    };
  }
}
