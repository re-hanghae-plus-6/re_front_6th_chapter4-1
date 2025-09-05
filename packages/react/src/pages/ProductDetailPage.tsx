import {
  loadProductDetailForPage,
  PRODUCT_ACTIONS,
  ProductDetail,
  productStore,
  useLoadProductDetail,
  useProductStore,
} from "../entities";
import { PageWrapper } from "./PageWrapper";
import { ErrorContent, PublicImage } from "../components";
import type { ProductDetailSSRResult } from "../api/ssrProductApi";
import { useEffect } from "react";
import { hydrateStores } from "../store/hydrateStores";
import { useRouterParams } from "../router";

export interface ProductDetailPageProps {
  initialData?: ProductDetailSSRResult | null;
}

export const ProductDetailPage = ({ initialData }: ProductDetailPageProps) => {
  const { currentProduct: product, error, loading } = useProductStore();

  const productId = useRouterParams((params) => params?.id);

  useEffect(() => {
    if (!productId) return;

    const state = productStore.getState();

    // ✅ SSR로 이미 같은 상품이 주입돼 있으면 fetch 스킵
    if (state.currentProduct?.productId === productId) {
      console.log("🔥 SSR 데이터 있음 → fetch 스킵");
      return;
    }

    console.log("🔥 CSR 진입 or 다른 상품 → fetch 실행");
    loadProductDetailForPage(productId as string);

    // 페이지 나갈 때 스토어 초기화
    return () => {
      console.log("🧹 상세 페이지 언마운트 → 스토어 초기화");
      productStore.dispatch({ type: PRODUCT_ACTIONS.ALL_RESET });
    };
  }, [productId]);

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
