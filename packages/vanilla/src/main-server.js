import { router } from "./router/router.js";
import { HomePage, ProductDetailPage, NotFoundPage } from "./pages";
import { retrieveProductDetails, retrieveProducts } from "./api/fetchDataSSR.js";

// 서버 사이드 렌더링을 위한 라우트 정의
router.addRoute("/", HomePage);
router.addRoute("/product/:id/", ProductDetailPage);

/**
 * SSR을 위해 적절한 페이지 콘텐츠를 렌더링하고 초기 데이터를 가져옵니다.
 * @param {string} url - 들어오는 요청 URL.
 * @param {object} query - 요청의 쿼리 파라미터.
 * @returns {Promise<{head: string, html: string, initialData: object|null}>} 렌더링된 페이지 상세 정보.
 */
export async function render(url, query = {}) {
  const matched = router.match(url); // 정의된 라우트에 URL을 매칭 시도

  // 404 Not Found 케이스 처리
  if (!matched) {
    return {
      head: "<title>404 Not Found</title>", // 더 설명적인 404 제목
      html: NotFoundPage(),
      initialData: null,
    };
  }

  const { path, params } = matched; // 매칭된 라우트에서 경로와 파라미터 추출

  let initialData = null; // initialData를 null로 초기화
  let pageTitle = "쇼핑몰"; // 기본 페이지 제목
  let pageHtml;

  // 매칭된 경로를 기반으로 데이터 가져오기
  if (path === "/") {
    initialData = await retrieveProducts(query);
    pageTitle = "쇼핑몰 - 홈";
    pageHtml = HomePage({ initialData, query });
  } else if (path === "/product/:id/") {
    initialData = await retrieveProductDetails(params.id);
    // 상품 데이터가 있는 경우 상품별 제목 설정
    pageTitle = initialData?.currentProduct?.title ? `${initialData.currentProduct.title} - 쇼핑몰` : "쇼핑몰";
    pageHtml = ProductDetailPage({ initialData });
  } else {
    // 매칭되었지만 처리되지 않은 다른 경로에 대한 폴백 (라우터가 완벽하다면 도달해서는 안 됨)
    pageHtml = NotFoundPage();
    pageTitle = "404 Not Found"; // 처리되지 않은 매칭 경로에 대해 404 제목이 설정되도록 보장
  }

  // 렌더링된 HTML, 헤드 콘텐츠 및 초기 데이터를 클라이언트 측 하이드레이션을 위해 반환
  return {
    head: `<title>${pageTitle}</title>`,
    html: pageHtml,
    initialData,
  };
}
