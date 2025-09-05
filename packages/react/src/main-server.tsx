import { renderToString } from "react-dom/server";

import { getCategories, getProducts } from "./api";
import { App } from "./App";
import { PRODUCT_ACTIONS, productStore } from "./entities";
import { router } from "./router";

export class SSRService {
  async render(url: string, query: Record<string, string>) {
    router.push(url);
    router.query = query;

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

    return {
      head: /* HTML */ `<title>쇼핑몰 - 홈</title>`,
      html: renderToString(<App />),
      data: productStore.getState(),
    };
  }
}
