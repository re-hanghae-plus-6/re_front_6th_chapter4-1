import { renderToString } from "react-dom/server";

import { getCategories, getProduct, getProducts } from "./api";
import { App } from "./App";
import { initialProductState, PRODUCT_ACTIONS, productStore, type Product } from "./entities";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { router } from "./router";

export class SSRService {
  constructor() {
    router.addRoute("/", HomePage);
    router.addRoute("/product/:id/", ProductDetailPage);
    router.addRoute(".*", NotFoundPage);
  }

  async render(url: string, query: Record<string, string>) {
    router.push(url);
    router.query = query;

    const route = router.route;

    if (!route || route.path === ".*") {
      return this.#renderNotFoundPage();
    }

    if (route.path === "/") {
      return this.#renderHomePage(query);
    }

    if (route.path === "/product/:id/") {
      const productId = route.params?.id;
      if (productId) {
        return this.#renderProductDetailPage(productId);
      }
    }

    return this.#renderNotFoundPage();
  }

  async #renderHomePage(query: Record<string, string>) {
    try {
      const [products, categories] = await Promise.all([getProducts(query), getCategories()]);

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: products.products,
          categories,
          totalCount: products.pagination.total,
          loading: false,
          status: "done",
        },
      });

      const state = productStore.getState();
      return {
        head: /* HTML */ `<title>쇼핑몰 - 홈</title>`,
        html: renderToString(<App />),
        data: {
          products: state.products,
          categories: state.categories,
          totalCount: state.totalCount,
        },
      };
    } catch (error) {
      console.error("홈페이지 렌더링 실패:", error);
      return this.#renderNotFoundPage();
    }
  }

  async #renderProductDetailPage(productId: string) {
    try {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: initialProductState,
      });

      const [product, categories] = await Promise.all([getProduct(productId), getCategories()]);

      if (!product) {
        return this.#renderNotFoundPage();
      }

      let relatedProducts: Product[] = [];
      if (product.category2) {
        try {
          const relatedResponse = await getProducts({
            category2: product.category2,
            limit: "20",
            page: "1",
          });
          relatedProducts = relatedResponse.products.filter((p) => p.productId !== productId);
        } catch (error) {
          console.error("관련 상품 로드 실패:", error);
        }
      }

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: [],
          categories,
          totalCount: 0,
          currentProduct: product,
          relatedProducts,
          loading: false,
          status: "done",
          error: null,
        },
      });

      const state = productStore.getState();
      return {
        head: /* HTML */ `<title>${product.title} - 쇼핑몰</title>`,
        html: renderToString(<App />),
        data: state,
      };
    } catch (error) {
      console.error("상품 상세 페이지 렌더링 실패:", error);
      return this.#renderNotFoundPage();
    }
  }

  async #renderNotFoundPage() {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: initialProductState,
    });

    return {
      head: /* HTML */ `<title>페이지를 찾을 수 없습니다 - 쇼핑몰</title>`,
      html: renderToString(<App />),
      data: null,
    };
  }
}
