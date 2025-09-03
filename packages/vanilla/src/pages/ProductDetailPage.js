import { ErrorContent, LoadingContent, ProductDetail } from "../components";
import { routerInstance, withLifecycle, withUniversal } from "../router";
import { loadProductDetailForPage } from "../services";
import { productStore } from "../stores";
import { PageWrapper } from "./PageWrapper";

const productDetailPageLifecycle = {
  onMount: () => {
    loadProductDetailForPage(routerInstance.params.id);
  },
  watches: [
    () => [routerInstance.params.id], //
    () => loadProductDetailForPage(routerInstance.params.id),
  ],
};

function ProductDetailPageComponent({ data }) {
  const storeState = data ? data : productStore.getState();
  const { currentProduct: product, relatedProducts = [], error, loading } = storeState;

  return PageWrapper({
    headerLeft: /* HTML */ `
      <div class="flex items-center space-x-3">
        <button onclick="window.history.back()" class="p-2 text-gray-700 hover:text-gray-900 transition-colors">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 class="text-lg font-bold text-gray-900">상품 상세</h1>
      </div>
    `.trim(),
    children: loading
      ? LoadingContent()
      : error && !product
        ? ErrorContent({ error })
        : ProductDetail({ product, relatedProducts }),
  });
}

export const ProductDetailPage = withUniversal(withLifecycle(productDetailPageLifecycle, ProductDetailPageComponent));
