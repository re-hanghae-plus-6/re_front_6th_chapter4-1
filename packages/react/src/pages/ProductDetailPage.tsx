/* eslint-disable @typescript-eslint/no-explicit-any */
import { ErrorContent, PublicImage } from "../components";
import { ProductDetail, useLoadProductDetail, useProductStore } from "../entities";
import { PageWrapper } from "./PageWrapper";

export const ProductDetailPage = () => {
  const { currentProduct: product, error, loading } = useProductStore();

  useLoadProductDetail();

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

ProductDetailPage.prefetch = async ({ params }: { params: Record<string, string> }) => {
  const { loadProductDetailForPage } = await import("../entities/products/productUseCase");
  await loadProductDetailForPage(params.id);

  const { productStore } = await import("../entities/products/productStore");
  return productStore.getState();
};

ProductDetailPage.meta = (data: any) => {
  const product = data.currentProduct;
  return product ? `<title>${product.title} - 쇼핑몰</title>` : `<title>상품 상세 - 쇼핑몰</title>`;
};
