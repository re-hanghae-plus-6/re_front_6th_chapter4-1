/* eslint-disable react-refresh/only-export-components */

import { getProduct, getProducts } from "../../api/productApi";
import { ErrorContent, PublicImage } from "../../components";
import type { GenerateMetaData, GetServerSideProps } from "../../core/router";

import { ProductDetail, useLoadProductDetail, useProductStoreContext } from "../../entities";
import type { GlobalInitialData } from "../../global";
import { PageWrapper } from "../PageWrapper";

export const generateMetaData: GenerateMetaData = async (ctx) => {
  const product = await getProduct(ctx.params.id);

  return { metadata: { title: `${product.title} - 쇼핑몰` } };
};

export const PageComponent = () => {
  const { state } = useProductStoreContext();

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
        {state.loading && (
          <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">상품 정보를 불러오는 중...</p>
            </div>
          </div>
        )}
        {state.error && <ErrorContent error={state.error} />}
        {state.currentProduct && <ProductDetail {...state.currentProduct} />}
      </div>
    </PageWrapper>
  );
};

export const getServerSideProps: GetServerSideProps<GlobalInitialData> = async ({ query, params }) => {
  try {
    const productId = params.id;
    if (!productId) {
      throw new Error("Product ID is required");
    }

    const product = await getProduct(productId);

    const relatedCandidateResponse = await getProducts({ category2: product.category2 });
    const relatedProducts = relatedCandidateResponse.products
      .filter((p) => p.productId !== product.productId)
      .slice(0, 20);

    return {
      props: {
        initialData: {
          products: [],
          categories: {},
          totalCount: 0,
          loading: false,
          error: null,
          currentProduct: product,
          relatedProducts: relatedProducts,
          status: "done",
          query,
        },
      },
    };
  } catch (error) {
    console.error("ProductDetailPage prefetch error:", error);
    return {
      props: {
        initialData: {
          products: [],
          categories: {},
          totalCount: 0,
          loading: false,
          error: null,
          currentProduct: null,
          relatedProducts: [],
          status: "idle",
          query,
        },
      },
    };
  }
};
