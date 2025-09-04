/* eslint-disable @typescript-eslint/no-explicit-any */
import { renderToString } from "react-dom/server";
import { App } from "./App";
import { router } from "./router";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { PRODUCT_ACTIONS, productStore } from "./entities/products/productStore";
import { getProducts, getCategories, getProduct } from "./api/productApi.js";

router.addRoute("/", HomePage);
router.addRoute("/product/:id/", ProductDetailPage);
router.addRoute(".*", NotFoundPage);

export const render = async (url: string, query: Record<string, any>) => {
  try {
    router.start(url, query);

    router.start(url, query);

    const route = router.route;

    if (!route) {
      return {
        html: NotFoundPage(),
        head: "<title>페이지를 찾을 수 없습니다</title>",
        data: JSON.stringify({}),
      };
    }

    let head = "<title>안녕하세요</title>";
    let initialData = {};

    // 2. 라우트별 데이터 로드
    if (route.path === "/") {
      try {
        // router.query를 사용서 검색/필터링 파라미터 포함
        const [productsResponse, categories] = await Promise.all([getProducts(router.query), getCategories()]);

        // 스토어에 데이터 설정
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

        // 테스트가 기대하는 정확한 구조로 데이터 설정
        initialData = {
          products: productsResponse.products || [],
          categories: categories || {},
          totalCount: productsResponse.pagination?.total || 0,
        };
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

        initialData = {
          products: [],
          categories: {},
          totalCount: 0,
        };
      }
    } else if (route.path === "/product/:id/") {
      const productId = route.params.id;

      try {
        const product = await getProduct(productId);

        // 관련 상품 로드
        let relatedProducts: any[] = [];
        if (product && product.category2) {
          const relatedResponse = await getProducts({
            category2: product.category2,
            limit: "20",
            page: "1",
          });
          relatedProducts = relatedResponse.products.filter((p) => p.productId !== productId);
        }

        // 스토어에 데이터 설정
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

        // 테스트가 기대하는 정확한 구조로 데이터 설정
        initialData = {
          product: product,
          relatedProducts: relatedProducts,
        };
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

        initialData = {
          product: null,
          relatedProducts: [],
        };
      }
    }

    // 3. 페이지 컴포넌트 렌더링

    const html = renderToString(<App />);
    return {
      html,
      head,
      data: JSON.stringify(initialData),
    };
  } catch (error: any) {
    return {
      html: `<div>서버 오류: ${error.message}</div>`,
      head: "<title>서버 오류</title>",
      data: JSON.stringify({}),
    };
  }
};
