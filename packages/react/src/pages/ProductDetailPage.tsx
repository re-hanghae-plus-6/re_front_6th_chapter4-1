import { ProductDetail, useLoadProductDetail, useProductStore } from "../entities";
import { PageWrapper } from "./PageWrapper";
import { ErrorContent, PublicImage } from "../components";
import type { SSRPageComponent, SSRContext, MetaData } from "../types/ssr";
import { getProduct, getProducts } from "../api/productApi";
import type { Product } from "../entities";

interface ProductDetailPageProps {
  ssrData?: {
    currentProduct: Product | null;
    relatedProducts: Product[];
  };
}

const ProductDetailPageComponent: SSRPageComponent<ProductDetailPageProps> = ({ ssrData }) => {
  const { currentProduct: product, error, loading } = useProductStore();

  // SSR 데이터가 없는 경우에만 클라이언트에서 데이터 로드
  useLoadProductDetail(!ssrData?.currentProduct);

  // SSR 데이터가 있으면 우선 사용, 없으면 스토어 상태 사용
  const currentProduct = ssrData?.currentProduct || product;
  const showLoading = loading && !ssrData?.currentProduct;
  const showError = error && !currentProduct;

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
        {showLoading && (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">상품 정보를 불러오는 중...</p>
            </div>
          </div>
        )}
        {showError && <ErrorContent error={error} />}
        {currentProduct && <ProductDetail {...currentProduct} />}
      </div>
    </PageWrapper>
  );
};

// SSR 메서드 - 로딩 상태 없이 완전한 데이터 반환
ProductDetailPageComponent.ssr = async ({ params }: SSRContext) => {
  try {
    console.log("상품 상세 페이지 SSR 시작:", params.id);

    const product = await getProduct(params.id);
    console.log("상품 데이터 로드 완료:", product?.title);

    if (!product) {
      throw new Error("Product not found");
    }

    let relatedProducts: Product[] = [];

    // 관련 상품 로드
    if (product.category2) {
      console.log("관련 상품 로드 시작:", product.category2);
      const relatedResponse = await getProducts({
        category2: product.category2,
        limit: "20",
        page: "1",
      });

      relatedProducts = relatedResponse.products.filter((p: Product) => p.productId !== params.id);
      console.log("관련 상품 로드 완료:", relatedProducts.length, "개");
    }

    // SSR에서는 로딩 상태 없이 완전한 데이터만 반환
    return {
      currentProduct: product,
      relatedProducts,
    };
  } catch (error) {
    console.error("상품 상세 페이지 SSR 실패:", error);
    // 에러 발생 시에도 기본 데이터 구조 유지
    return {
      currentProduct: null,
      relatedProducts: [],
    };
  }
};

// 메타데이터 생성
ProductDetailPageComponent.metadata = ({ data }: { data?: { currentProduct?: Product | null } } = {}): MetaData => {
  const product = data?.currentProduct;

  if (product) {
    return {
      title: `${product.title} - 쇼핑몰`,
      description: `${product.title} 상품 정보를 확인하세요. ${product.brand}에서 제공하는 고품질 상품입니다.`,
      keywords: `${product.title}, ${product.brand}, 쇼핑, ${product.category1}, ${product.category2}`,
      image: product.image,
    };
  }

  return {
    title: "상품 상세 - 쇼핑몰",
    description: "상품 정보를 확인하세요",
    keywords: "상품, 상세, 쇼핑몰",
  };
};

export const ProductDetailPage = ProductDetailPageComponent;
