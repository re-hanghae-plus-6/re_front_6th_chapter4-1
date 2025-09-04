import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { router } from "./router";
import { getProducts, getCategories, getProduct } from "./api/productApi.js";
import { productStore } from "./stores";
import { PRODUCT_ACTIONS } from "./stores/actionTypes";
import { BASE_URL } from "./constants.js";

// 라우터에 페이지별 경로와 컴포넌트 등록
router.addRoute("/", HomePage);
router.addRoute("/product/:id/", ProductDetailPage);
router.addRoute(".*", NotFoundPage);

/**
 * SSR 렌더링 메인 함수 - 서버에서 HTML을 생성하여 클라이언트로 전송
 * @param {string} url - 요청받은 URL 경로
 * @param {Object} query - URL의 쿼리 파라미터 객체
 * @returns {Object} {html, head, data} 형태의 렌더링 결과
 */
export const render = async (url = "", query) => {
  try {
    // URL 정규화 - BASE_URL 제거하여 상대 경로로 변환
    let normalizedUrl = url;
    if (url.includes(BASE_URL) && BASE_URL !== "/") {
      normalizedUrl = url.replace(BASE_URL, "/").replace(/\/+/g, "/");
    }

    // 서버사이드 라우터 시작
    router.start(normalizedUrl, query);

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

    // 라우트별 데이터 설정
    if (route.path === "/") {
      try {
        // 라우터의 쿼리 파라미터를 사용하여 검색/필터링/페이징 적용
        const [productsResponse, categories] = await Promise.all([getProducts(router.query), getCategories()]);

        // 서버사이드에서 스토어에 데이터 미리 설정 (하이드레이션)
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

        // 클라이언트 하이드레이션용 초기 데이터 (window.__INITIAL_DATA__)
        initialData = {
          products: productsResponse.products || [],
          categories: categories || {},
          totalCount: productsResponse.pagination?.total || 0,
        };
      } catch (dataError) {
        // 데이터 로드 실패 시 에러 상태로 스토어 설정
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
        // 관련 상품
        let relatedProducts = [];
        if (product && product.category2) {
          const relatedResponse = await getProducts({
            category2: product.category2,
            limit: 20,
            page: 1,
          });
          // 현재 상품은 관련 상품에서 제외
          relatedProducts = relatedResponse.products.filter((p) => p.productId !== productId);
        }

        // 상품 상세페이지용 스토어 설정
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

        // 상품 상세페이지용 초기 데이터
        initialData = {
          product: product,
          relatedProducts: relatedProducts,
        };
      } catch (dataError) {
        // 상품 조회 실패 시 (존재하지 않는 상품 등)
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

    const PageComponent = router.target;

    const html = PageComponent();

    // 최종 렌더링 결과 반환
    return {
      html,
      head,
      data: JSON.stringify(initialData),
    };
  } catch (error) {
    return {
      html: `<div>서버 오류: ${error.message}</div>`,
      head: "<title>서버 오류</title>",
      data: JSON.stringify({}),
    };
  }
};
