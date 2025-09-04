import { PRODUCT_ACTIONS, ProductDetail, productStore, useLoadProductDetail, useProductStore } from "../entities";
import { PageWrapper } from "./PageWrapper";
import { ErrorContent, PublicImage } from "../components";
import type { ProductDetailSSRResult } from "../api/ssrProductApi";
import { useEffect } from "react";
import { hydrateStores } from "../store/hydrateStores";

export interface ProductDetailPageProps {
  initialData?: ProductDetailSSRResult | null;
}

export const ProductDetailPage = ({ initialData }: ProductDetailPageProps) => {
  const { currentProduct: product, error, loading } = useProductStore();

  console.log("😡 productDetailPage initialData", initialData);

  // --SSR-- 환경에서 미리 주입하기
  if (typeof window === "undefined" && initialData?.currentProduct) {
    console.log("🔥 첫 번째 레슨 : SSR initialData를 스토어에 하이드레이트");
    hydrateStores(initialData);
  }

  // --CSR-- 진입 후 window.__INITIAL_DATA__가 있으면 주입
  useEffect(() => {
    productStore.dispatch({ type: PRODUCT_ACTIONS.ALL_RESET });

    if (initialData?.currentProduct) {
      // ✅ SSR로 받아온 데이터를 CSR에서도 이어받아 사용
      console.log("🔥 CSR: SSR initialData를 스토어에 주입");
      hydrateStores(initialData);
    } else {
      // ✅ SSR 데이터가 없으면 CSR로 직접 API 호출 준비
      console.log("🔥 CSR: SSR 데이터 없음 → 스토어 초기화 후 API 요청 대기");
      productStore.dispatch({ type: PRODUCT_ACTIONS.RESET_FILTERS });
    }

    // ✅ 상세 페이지에서 나갈 때 항상 스토어 초기화
    return () => {
      console.log("🧹 CSR: 상세 페이지 언마운트 → 스토어 초기화");
      productStore.dispatch({ type: PRODUCT_ACTIONS.RESET_FILTERS });
    };
  }, [initialData]);

  // SSR 데이터가 있으면 CSR fetch 막기
  // 데이터가 있으면 false, 없으면 true
  useLoadProductDetail(!initialData?.currentProduct);

  return (
    <PageWrapper
      headerLeft={
        <div className="flex items-center space-x-3">
          <button
            onClick={() => window.history.back()}
            className="p-2 text-gray-700 hover:text-gray-900 transition-colors"
          >
            <PublicImage src="/back-icon.svg" alt="뒤로" className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-gray-900">상품 상세</h1>
        </div>
      }
    >
      <div className="min-h-screen bg-gray-50 p-4">
        {loading && (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">상품 정보를 불러오는 중...</p>
            </div>
          </div>
        )}
        {error && <ErrorContent error={error} />}
        {product && <ProductDetail {...product} />}
      </div>
    </PageWrapper>
  );
};
