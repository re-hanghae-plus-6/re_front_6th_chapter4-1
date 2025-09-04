import { getCategories, getProduct, getProducts } from "./api/productApi";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { serverRouter } from "./router/serverRouter";
import { PRODUCT_ACTIONS, productStore } from "./stores";

// 서버 라우터 등록
serverRouter.addRoute("/", HomePage);
serverRouter.addRoute("/product/:id/", ProductDetailPage);
serverRouter.addRoute(".*", NotFoundPage);

// 스토어 디스패치 헬퍼 함수
const updateStore = (payload) => {
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload,
  });
};

// 기본 스토어 상태 생성 함수
const createBaseStoreState = () => ({
  products: [],
  totalCount: 0,
  categories: {},
  currentProduct: null,
  relatedProducts: [],
  loading: false,
  error: null,
  status: "done",
});

/**
 * 서버 렌더링 함수
 * @param {string} url - 요청 URL
 * @param {Object} query - 요청 쿼리
 * @returns {Promise<Object>} - 렌더링 결과
 */
export const render = async (url, query) => {
  try {
    // URL에서 쿼리 파라미터 추출
    const urlObj = new URL(url, "http://localhost");
    const urlQuery = {};
    urlObj.searchParams.forEach((value, key) => {
      urlQuery[key] = value;
    });

    // 전달된 query와 URL의 쿼리를 병합
    const mergedQuery = { ...urlQuery, ...query };

    // 전체 URL을 사용하여 라우터 시작
    serverRouter.start(url, mergedQuery);

    // router 객체의 query도 설정
    if (typeof window === "undefined") {
      const { router } = await import("./router/router.js");
      router.query = mergedQuery;
    }

    const route = serverRouter.route;
    if (!route) {
      return {
        head: "<title>페이지를 찾을 수 없습니다</title>",
        html: NotFoundPage(),
        initialData: {},
      };
    }

    let head;
    let initialData;

    // 홈페이지 처리
    if (route.path === "/") {
      try {
        const [productsResponse, categories] = await Promise.all([getProducts(serverRouter.query), getCategories()]);

        const storeState = {
          ...createBaseStoreState(),
          products: productsResponse.products || [],
          totalCount: productsResponse.pagination?.total || 0,
          categories: categories || {},
        };

        updateStore(storeState);

        // withLifecycle의 metadata 함수 호출
        const metadata = HomePage.metadata ? HomePage.metadata() : {};
        head = `<title>${metadata.title || "쇼핑몰 - 홈"}</title>
<meta name="description" content="${metadata.description || "다양한 상품을 만나보세요"}">`;
        initialData = {
          products: storeState.products,
          categories: storeState.categories,
          totalCount: storeState.totalCount,
        };
      } catch (error) {
        const errorState = {
          ...createBaseStoreState(),
          error: error.message,
          status: "error",
        };

        updateStore(errorState);

        initialData = {
          products: [],
          categories: {},
          totalCount: 0,
        };
      }
    }
    // 상품 상세 페이지 처리
    else if (route.path === "/product/:id/") {
      const productId = route.params.id;

      try {
        const product = await getProduct(productId);

        let relatedProducts = [];
        if (product?.category2) {
          const relatedResponse = await getProducts({
            category2: product.category2,
            limit: 20,
            page: 1,
          });
          relatedProducts = relatedResponse.products?.filter((p) => p.productId !== productId) || [];
        }

        const storeState = {
          ...createBaseStoreState(),
          currentProduct: product,
          relatedProducts,
        };

        updateStore(storeState);

        // 상품 데이터가 있을 때만 동적 메타데이터 생성
        if (product) {
          head = `<title>${product.title} - 쇼핑몰</title>
<meta name="description" content="${product.title} 상품 정보를 확인해보세요.">`;
        } else {
          head = `<title>상품 상세 - 쇼핑몰</title>
<meta name="description" content="상품 정보를 확인해보세요.">`;
        }
        initialData = {
          product,
          relatedProducts,
        };
      } catch (error) {
        const errorState = {
          ...createBaseStoreState(),
          error: error.message,
          status: "error",
        };

        updateStore(errorState);

        initialData = {
          product: null,
          relatedProducts: [],
        };
      }
    }

    const PageComponent = serverRouter.target;
    const html = PageComponent();

    return {
      html,
      head,
      initialData,
    };
  } catch (error) {
    console.error("❌ SSR 에러:", error);

    return {
      head: "<title>에러</title>",
      html: "<div>서버 오류가 발생했습니다.</div>",
      initialData: { error: error.message },
    };
  }
};
