import { ServerRouter } from "./lib/ServerRouter.js";
import { HomePage } from "./pages/HomePage.js";
import { NotFoundPage } from "./pages/NotFoundPage.js";
import { ProductDetailPage } from "./pages/ProductDetailPage.js";
import { loadProductDetailForPage, loadProductsAndCategories } from "./services/productService.js";
import { productStore } from "./stores/productStore.js";

const serverRouter = new ServerRouter();

serverRouter.addRoute("/", (_, query) => renderHomePage(query));
serverRouter.addRoute("/product/:id", (params) => renderProductDetailPage(params.id));
serverRouter.addRoute(".*", () => render404Page());

export const render = async (url, query) => {
  serverRouter.push(url);
  const route = serverRouter.route;
  return route.handler(route.params, query);
};

async function renderHomePage(query) {
  try {
    await loadProductsAndCategories();
    const initialData = productStore.getState();

    return {
      head: /* HTML */ `<title>쇼핑몰</title>`,
      html: HomePage({ query }),
      data: initialData,
    };
  } catch {
    return render404Page();
  }
}

async function renderProductDetailPage(productId) {
  try {
    await loadProductDetailForPage(productId);
    const initialData = productStore.getState();
    const product = initialData.currentProduct;

    return {
      head: /* HTML */ `<title>${product.title} - 쇼핑몰</title>`,
      html: ProductDetailPage({ productId }),
      data: initialData,
    };
  } catch {
    return render404Page();
  }
}

function render404Page() {
  return {
    head: /* HTML */ `<title>페이지를 찾을 수 없습니다 - 쇼핑몰</title>`,
    html: NotFoundPage(),
    data: null,
  };
}
