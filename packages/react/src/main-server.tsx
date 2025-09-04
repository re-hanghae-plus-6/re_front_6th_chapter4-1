import { App } from "./App";
import { router } from "./router/router";
import { renderToString } from "react-dom/server";
import { PRODUCT_ACTIONS, productStore } from "./entities";
import { getDetailProduct, getProducts, getUniqueCategories } from "./mocks/serverMock";

export const render = async (url: string, query: Record<string, string>) => {
  console.log({ url, query });

  router.push(url);
  router.query = query;

  if (url === "/") {
    const {
      products,
      pagination: { total },
    } = getProducts(router.query);

    const categories = getUniqueCategories();

    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        products,
        categories,
        totalCount: total,
        loading: false,
        status: "done",
      },
    });
  } else {
    // detail page
    const product = getDetailProduct(router.params.id);
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
      payload: product,
    });

    if (product) {
      const response = getProducts({ category2: router.params.category2 });

      // 현재 상품 제외
      const relatedProducts = response.products.filter((product) => product.productId !== router.params.id);

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
        payload: relatedProducts,
      });
    }
  }

  const { products, categories, totalCount, currentProduct } = productStore.getState();

  const initialData = {
    products,
    categories,
    totalCount,
  };

  function generateHomePageHead(url: string) {
    let title = "";
    if (url === "") {
      title = "쇼핑몰 - 홈";
    } else {
      title = currentProduct?.title + " - 쇼핑몰";
    }

    return `<title>${title}</title>`;
  }

  return {
    head: generateHomePageHead(url),
    html: renderToString(<App />),
    initialData,
  };
};
