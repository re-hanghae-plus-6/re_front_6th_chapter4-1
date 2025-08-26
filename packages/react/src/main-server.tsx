import { renderToString } from "react-dom/server";
import { App } from "./App";
import { router } from "./router";
import { loadHomePageData, loadProductDetailData } from "./services/ssr-data";
import { PRODUCT_ACTIONS, productStore } from "./entities";

export const render = async (url: string) => {
  // URL 보정: 빈 문자열인 경우 "/", "/"로 시작하지 않으면 "/" 추가
  let actualUrl = url || "/";
  if (!actualUrl.startsWith("/")) {
    actualUrl = "/" + actualUrl;
  }

  console.log("🚀 SSR 렌더링 시작:", actualUrl);

  // SSR에서도 라우터 시작 (start 메소드는 SSR 안전하게 수정됨)
  if (typeof window === "undefined") {
    router.navigate(actualUrl); // SSR에서는 navigate 직접 호출
  }

  // URL에 따라 필요한 데이터 미리 로드
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let initialData: any = {};

  try {
    // URL 패턴에 따라 데이터 로드
    if (actualUrl === "/" || actualUrl.startsWith("/?")) {
      // 홈페이지 - 상품 목록 데이터 로드
      console.log("🏠 홈페이지 데이터 로딩");
      const homeData = await loadHomePageData(actualUrl);
      if (homeData) {
        initialData = homeData;

        // SSR 시 스토어를 미리 초기화
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SETUP,
          payload: {
            products: homeData.products,
            categories: homeData.categories,
            totalCount: homeData.totalCount,
            loading: false,
            status: "done",
            error: null,
          },
        });
        console.log("🔄 SSR 스토어 초기화 완료: 홈페이지");
      }
    } else if (actualUrl.startsWith("/product/")) {
      // 상품 상세 페이지 - 해당 상품 데이터 로드
      const productId = actualUrl.split("/product/")[1];
      console.log("📦 상품 상세 데이터 로딩:", productId);
      const productData = await loadProductDetailData(productId);
      if (productData) {
        initialData = productData;

        // SSR 시 스토어를 미리 초기화
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
          payload: productData.currentProduct,
        });

        if (productData.relatedProducts) {
          productStore.dispatch({
            type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
            payload: productData.relatedProducts,
          });
        }
        console.log("🔄 SSR 스토어 초기화 완료: 상품 상세");
      }
    }

    console.log("📊 초기 데이터 로드 완료:", Object.keys(initialData));

    // 실제 App 컴포넌트를 SSR로 렌더링
    const html = renderToString(<App />);

    return {
      html,
      head: `<title>React Shopping App</title>`,
      initialData,
    };
  } catch (error) {
    const err = error as Error;
    console.error("SSR 렌더링 오류:", error);
    console.error("Error stack:", err.stack);
    console.error("Error message:", err.message);

    // 오류 발생 시 기본 HTML 반환
    return {
      html: `<div>페이지를 불러오는 중 오류가 발생했습니다: ${err.message}</div>`,
      head: `<title>React Shopping App</title>`,
      initialData: {},
    };
  }
};
