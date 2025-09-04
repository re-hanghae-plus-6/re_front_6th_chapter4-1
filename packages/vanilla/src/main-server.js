import { createStore } from "./lib/createStore.js";
import { ServerRouter } from "./lib/ServerRouter.js";
import { HomePage } from "./pages/HomePage.js";
import { NotFoundPage } from "./pages/NotFoundPage.js";
import { ProductDetailPage } from "./pages/ProductDetailPage.js";
import { loadProductDetailForPage, loadProductsAndCategories } from "./services/productService.js";
import { initialProductState, productReducer } from "./stores/productStore.js";

export class SSRService {
  #router = new ServerRouter();

  constructor() {
    this.#router.addRoute("/", (_, query) => this.#renderHomePage(query));
    this.#router.addRoute("/product/:id/", (params) => this.#renderProductDetailPage(params.id));
    this.#router.addRoute(".*", () => this.#renderNotFoundPage());
  }

  async render(url, query) {
    this.#router.push(url);
    const route = this.#router.route;

    return route.handler(route.params, query);
  }

  async #renderHomePage(query) {
    try {
      const requestStore = createStore(productReducer, initialProductState);
      await loadProductsAndCategories(query, requestStore);
      const initialData = requestStore.getState();

      return {
        head: /* HTML */ `<title>쇼핑몰 - 홈</title>`,
        html: HomePage({ query, data: initialData }),
        data: initialData,
      };
    } catch {
      return this.#renderNotFoundPage();
    }
  }

  async #renderProductDetailPage(productId) {
    try {
      const requestStore = createStore(productReducer, initialProductState);
      await loadProductDetailForPage(productId, requestStore);
      const initialData = requestStore.getState();

      if (!initialData.currentProduct) {
        return this.#renderNotFoundPage();
      }

      return {
        head: /* HTML */ `<title>${initialData.currentProduct.title} - 쇼핑몰</title>`,
        html: ProductDetailPage({ data: initialData }),
        data: initialData,
      };
    } catch {
      return this.#renderNotFoundPage();
    }
  }

  async #renderNotFoundPage() {
    return {
      head: /* HTML */ `<title>페이지를 찾을 수 없습니다 - 쇼핑몰</title>`,
      html: NotFoundPage(),
      data: null,
    };
  }
}
