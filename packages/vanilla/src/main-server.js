import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { router } from "./router";
import { getProducts, getCategories, getProduct } from "./api/productApi.js";
import { productStore } from "./stores";
import { PRODUCT_ACTIONS } from "./stores/actionTypes";

router.addRoute("/", HomePage);
router.addRoute("/product/:id/", ProductDetailPage);
router.addRoute(".*", NotFoundPage);

export const render = async (url, query) => {
  router.start(url, query);
  const route = router.route;
  if (!route) {
    return {
      head: "",
      html: NotFoundPage(),
      initialData: JSON.stringify({}),
    };
  }
  let head = "";
  let data;

  if (route.path === "/") {
    try {
      const [productsData, categories] = await Promise.all([getProducts(query), getCategories()]);

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: productsData,
          categories: categories,
          totalCount: productsData.pagination.total || 0,
          loading: false,
          status: "done",
          error: null,
          currentProduct: null,
          relatedProducts: [],
        },
      });

      head = `
      <title>쇼핑몰 - 홈</title>
      <meta name="description" content="쇼핑몰 홈">
    `;
      data = {
        products: productsData.products || [],
        categories: categories || {},
        totalCount: productsData.pagination.total || 0,
      };
    } catch (error) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          currentProduct: null,
          relatedProducts: [],
          loading: false,
          status: "done",
          error: error.message,
          categories: {},
          totalCount: 0,
          products: [],
        },
      });

      data = {
        products: [],
        categories: {},
        totalCount: 0,
      };
    }
  } else if (route.path === "/product/:id/") {
    const productId = route.params.id;

    try {
      const product = await getProduct(productId);

      let relatedProducts = [];
      if (product && product.category2) {
        relatedProducts = await getProducts({ category2: product.category2, limit: 20, page: 1 }).filter(
          (p) => p.productId !== productId,
        );
      }

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          currentProduct: product,
          relatedProducts: relatedProducts,
          loading: false,
          status: "done",
          error: null,
          categories: {},
          totalCount: 0,
          products: [],
        },
      });

      head = `
        <title>${product.title} - 쇼핑몰</title>
        <meta name="description" content="${product.description}">
      `;

      data = {
        product: product,
        relatedProducts: relatedProducts,
      };
    } catch (error) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          currentProduct: null,
          relatedProducts: [],
          loading: false,
          status: "done",
          error: error.message,
          categories: {},
          totalCount: 0,
          products: [],
        },
      });

      data = {
        products: [],
        categories: {},
        totalCount: 0,
      };
    }
  }

  return {
    head: head,
    html: router.target(),
    initialData: JSON.stringify(data),
  };
};
