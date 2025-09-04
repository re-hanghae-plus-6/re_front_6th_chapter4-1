// API 기본 URL을 환경별로 동적 설정
const getBaseUrl = () => {
  // 클라이언트 환경: 상대 경로 사용 (같은 도메인의 API 호출)
  if (typeof window !== "undefined") {
    return ""; // 브라우저에서는 빈 문자열로 상대 경로 사용
  }

  // 서버 환경: 절대 URL 필요 (서버에서 서버로 호출)
  const prod = process.env.NODE_ENV === "production";
  return prod ? "http://localhost:4174" : "http://localhost:5174"; // 환경별 포트 설정
};

const BASE_URL = getBaseUrl(); // 런타임에 환경에 맞는 BASE_URL 결정

/**
 * 상품 목록 조회 API - 검색, 필터링, 페이징 지원
 * @param {Object} params - 쿼리 파라미터 객체
 * @param {number} params.limit - 페이지당 상품 수 (기본값: 20)
 * @param {string} params.search - 검색 키워드
 * @param {string} params.category1 - 1차 카테고리 필터
 * @param {string} params.category2 - 2차 카테고리 필터
 * @param {string} params.sort - 정렬 방식 (기본값: "price_asc")
 * @param {number} params.current|params.page - 현재 페이지 번호
 * @returns {Promise<Object>} {products: Array, pagination: Object} 형태의 응답
 */
export async function getProducts(params = {}) {
  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
  const page = params.current ?? params.page ?? 1;

  // URL 쿼리 파라미터 구성 (빈 값들은 자동으로 제외됨)
  const searchParams = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(search && { search }),
    ...(category1 && { category1 }),
    ...(category2 && { category2 }),
    sort,
  });

  // API 호출 및 JSON 응답 파싱
  const response = await fetch(`${BASE_URL}/api/products?${searchParams}`);
  return await response.json();
}

/**
 * 특정 상품의 상세 정보 조회
 * @param {string} productId - 조회할 상품의 고유 ID
 * @returns {Promise<Object>} 상품 상세 정보 객체
 */
export async function getProduct(productId) {
  // RESTful API 패턴: GET /api/products/{id}
  const response = await fetch(`${BASE_URL}/api/products/${productId}`);
  return await response.json();
}

/**
 * 전체 카테고리 목록 조회 (1차, 2차 카테고리 포함)
 * @returns {Promise<Object>} 카테고리 트리 구조 객체
 */
export async function getCategories() {
  // 카테고리는 자주 변경되지 않는 마스터 데이터
  const response = await fetch(`${BASE_URL}/api/categories`);
  return await response.json();
}
