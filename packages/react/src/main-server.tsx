/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderToString } from "react-dom/server";
import { App } from "./App";
import { router } from "./router";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { PRODUCT_ACTIONS, productStore, type Categories, type Product } from "./entities";
import { getCategories, getProduct, getProducts } from "./api/productApi";

router.addRoute("/", HomePage);
router.addRoute("/product/:id/", ProductDetailPage);
router.addRoute(".*", NotFoundPage);

interface InitialData {
  products: Product[];
  categories: Categories;
  totalCount: number;
  product: Product | null;
  relatedProducts: Product[];
  error: string | null;
}

export const render = async (url: string, query: Record<string, string>) => {
  router.start(url, query);

  const route = router.route;

  if (!route) {
    return { html: NotFoundPage(), head: "<title>페이지를 찾을 수 없습니다</title>", data: JSON.stringify({}) };
  }

  const initialData: InitialData = {
    products: [],
    categories: {},
    totalCount: 0,
    product: null,
    relatedProducts: [],
    error: null,
  };
  let head = "";

  if (route.path === "/") {
    try {
      const [productsResponse, categories] = await Promise.all([getProducts(router.query), getCategories()]);

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: productsResponse.products || [],
          totalCount: productsResponse.pagination?.total || 0,
          categories: categories || {},
          currentProduct: null,
          relatedProducts: [],
          loading: false,
          error: null,
          status: "done",
        },
      });

      head = "<title>쇼핑몰 - 홈</title>";
      initialData.products = productsResponse.products || [];
      initialData.categories = categories || {};
      initialData.totalCount = productsResponse.pagination?.total || 0;
      initialData.error = null;
    } catch (dataError: any) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: [],
          totalCount: 0,
          categories: {},
          currentProduct: null,
          relatedProducts: [],
          loading: false,
          error: dataError.message,
          status: "error",
        },
      });

      initialData.products = [];
      initialData.categories = {};
      initialData.totalCount = 0;
      initialData.error = dataError.message ?? "서버 오류";
    }
  } else if (route.path === "/product/:id/") {
    const productId = route.params.id;

    try {
      const product = await getProduct(productId);

      let relatedProducts: Product[] = [];
      if (product && product.category2) {
        const relatedResponse = await getProducts({
          category2: product.category2,
          limit: "20",
          page: "1",
        });
        relatedProducts = relatedResponse.products.filter((p) => p.productId !== productId);
      }

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: [],
          totalCount: 0,
          categories: {},
          currentProduct: product,
          relatedProducts: relatedProducts,
          loading: false,
          error: null,
          status: "done",
        },
      });

      head = `<title>${product.title} - 쇼핑몰</title>`;
      initialData.product = product;
      initialData.relatedProducts = relatedProducts;
      initialData.error = null;
    } catch (dataError: any) {
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: [],
          totalCount: 0,
          categories: {},
          currentProduct: null,
          relatedProducts: [],
          loading: false,
          error: dataError.message,
          status: "error",
        },
      });

      initialData.product = null;
      initialData.relatedProducts = [];
      initialData.error = dataError.message ?? "서버 오류";
    }
  }

  // 데이터 세팅이 끝난 뒤 렌더링
  const html = renderToString(<App />);

  // SSR에서 폼 초기값 유지: 쿼리를 기반으로 input/select의 value가 렌더링되도록 함
  if (route.path === "/") {
    const { search = "", limit = "20", sort = "price_asc", category1 = "", category2 = "" } = router.query;
    // 클라이언트 하이드레이션 전에 UI 상태가 반영되도록 store에 이미 세팅된 데이터와 함께 쿼리 기반 값이
    // 입력 요소의 defaultValue로 반영되므로 별도 조치 불필요. 다만 테스트가 값 존재를 검증하므로
    // window.__INITIAL_DATA__에 쿼리도 포함시켜 CSR 일관성을 유지한다.
    (initialData as any).filters = { search, limit, sort, category1, category2 };
  }

  return { html, head, data: JSON.stringify(initialData) };
};
