import { serverRouter } from "./router/ServerRoute.js";
import { productStore } from "./stores/productStore.js";
import { PRODUCT_ACTIONS } from "./stores/actionTypes.js";

serverRouter.addRoute("/", "HomePage");
serverRouter.addRoute("/product/:id/", "ProductDetailPage");

export async function render(url) {
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: {
      products: [],
      currentProduct: null,
      categories: {},
      loading: true,
      error: null,
      status: "idle",
    },
  });

  const route = serverRouter.findRoute(url);
  console.log("SSR Route found:", route);

  if (!route) {
    console.log("SSR 404: No route found for", url);
    return {
      html: "<div><h1>404 - 페이지를 찾을 수 없습니다</h1></div>",
      head: { title: "404 - 페이지를 찾을 수 없습니다" },
      initialData: null,
    };
  }

  if (route.path === "/") {
    console.log("SSR HomePage: Query params:", route.query);
    const { HomePage, getServerSideProps: getHomeProps } = await import("./pages/HomePage.js");

    const { props } = await getHomeProps(route.query);
    console.log("SSR HomePage: Props received:", {
      productCount: props.products?.length,
      totalCount: props.totalCount,
    });

    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        products: props.products,
        totalCount: props.totalCount,
        categories: props.categories,
        loading: false,
        status: "done",
      },
    });

    const html = HomePage(props);

    // 데이터 정규화 (공백 및 특수문자 정리)
    const normalizedProps = JSON.parse(
      JSON.stringify(props, (key, value) => {
        if (typeof value === "string") {
          return value.replace(/\s+/g, " ").trim();
        }
        return value;
      }),
    );

    return {
      html,
      head: { title: "쇼핑몰 - 홈" },
      initialData: { ...normalizedProps },
    };
  } else if (route.path === "/product/:id/") {
    const { ProductDetailPage, getServerSideProps: getProductProps } = await import("./pages/ProductDetailPage.js");
    const { props } = await getProductProps(route.params, route.query);

    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
      payload: props.product,
    });

    const html = ProductDetailPage(props);

    // 데이터 정규화 (공백 및 특수문자 정리)
    const normalizedProduct = JSON.parse(
      JSON.stringify(props.product, (key, value) => {
        if (typeof value === "string") {
          return value.replace(/\s+/g, " ").trim();
        }
        return value;
      }),
    );

    return {
      html,
      head: { title: `${props.product?.title || "상품 상세"} - 쇼핑몰` },
      initialData: { currentProduct: normalizedProduct },
    };
  }

  return {
    html: "<div>페이지를 찾을 수 없습니다</div>",
    head: { title: "404 - 페이지를 찾을 수 없습니다" },
    initialData: null,
  };
}
