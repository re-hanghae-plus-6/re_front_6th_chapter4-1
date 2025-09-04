import { ProductList, SearchBar } from "../../components/index.js";
import { ServerPageWrapper } from "./ServerPageWrapper.js";

/**
 * 서버 사이드 렌더링을 위한 HomePage 컴포넌트
 * withLifecycle 없이 순수한 렌더링 함수로 구현
 *
 * @param {Object} props - 렌더링에 필요한 데이터
 * @param {Array} props.products - 상품 목록
 * @param {Object} props.categories - 카테고리 목록
 * @param {Object} props.query - 현재 쿼리 파라미터
 * @param {number} props.totalCount - 총 상품 수
 */
export function ServerHomePage({ products = [], categories = {}, query = {}, totalCount = 0 }) {
  const { search = "", limit = 20, sort = "price_asc", category1 = "", category2 = "" } = query;

  const category = { category1, category2 };
  const hasMore = products.length < totalCount;

  return ServerPageWrapper({
    headerLeft: `
      <h1 class="text-xl font-bold text-gray-900">
        <a href="/" data-link>쇼핑몰</a>
      </h1>
    `.trim(),
    children: `
      <!-- 검색 및 필터 -->
      ${SearchBar({
        searchQuery: search,
        limit,
        sort,
        category,
        categories,
      })}
      
      <!-- 상품 목록 -->
      <div class="mb-6">
        ${ProductList({
          products,
          loading: false, // 서버에서는 로딩 상태 없음
          error: null, // 서버에서는 에러 상태 없음 (에러 시 다른 처리)
          totalCount,
          hasMore,
        })}
      </div>
    `.trim(),
  });
}
