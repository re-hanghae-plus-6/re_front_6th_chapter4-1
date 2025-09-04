import { PublicImage } from "../../../components";
import { useRouterContext } from "../../../core/router";

import { useProductStoreContext } from "../hooks";
import { ProductCard, ProductCardSkeleton } from "./ProductCard";

/**
 * 상품 목록 컴포넌트
 */
export function ProductList() {
  const router = useRouterContext();
  const { state, action } = useProductStoreContext();

  const hasMore = state.products.length < state.totalCount;

  const retry = async () => {
    try {
      await action.loadProducts(true);
    } catch (error) {
      console.error("재시도 실패:", error);
    }
  };

  const goToDetailPage = async (productId: string) => {
    // 상품 상세 페이지로 이동
    router.push(`/product/${productId}/`);
  };

  // 에러 상태
  if (state.error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <PublicImage src="/error-large-icon.svg" alt="오류" className="mx-auto h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">오류가 발생했습니다</h3>
        <p className="text-gray-600 mb-4">{state.error}</p>
        <button
          id="retry-btn"
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          onClick={retry}
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 빈 상태 (검색 결과 없음)
  if (!state.loading && state.products.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">
          <PublicImage src="/search-large-icon.svg" alt="검색" className="mx-auto h-12 w-12" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">상품을 찾을 수 없습니다</h3>
        <p className="text-gray-600">다른 검색어를 시도해보세요.</p>
      </div>
    );
  }

  return (
    <div>
      {/* 상품 개수 정보 */}
      {state.totalCount > 0 && (
        <div className="mb-4 text-sm text-gray-600">
          총 <span className="font-medium text-gray-900">{state.totalCount.toLocaleString()}개</span>의 상품
        </div>
      )}

      {/* 상품 그리드 */}
      <div className="grid grid-cols-2 gap-4 mb-6" id="products-grid">
        {/* 로딩 스켈레톤 */}
        {state.products.map((product) => (
          <ProductCard key={product.productId} {...product} onClick={goToDetailPage} />
        ))}

        {state.loading && Array.from({ length: 6 }).map((_, index) => <ProductCardSkeleton key={index} />)}
      </div>

      {/* 무한 스크롤 로딩 */}
      {state.loading && state.products.length > 0 && (
        <div className="text-center py-4">
          <div className="inline-flex items-center">
            <PublicImage src="/loading-icon.svg" alt="로딩" className="animate-spin h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm text-gray-600">상품을 불러오는 중...</span>
          </div>
        </div>
      )}

      {/* 더 이상 로드할 상품이 없음 */}
      {!hasMore && state.products.length > 0 && !state.loading && (
        <div className="text-center py-4 text-sm text-gray-500">모든 상품을 확인했습니다</div>
      )}

      {/* 무한 스크롤 트리거 */}
      <div id="scroll-trigger" className="h-4"></div>
    </div>
  );
}
