import { useEffect } from "react";
import { loadNextProducts, loadProductsAndCategories, ProductList, productStore, SearchBar } from "../entities";
import { PageWrapper } from "./PageWrapper";
import type { ProductsSSRResult } from "../api/ssrProductApi";
import { hydrateStores } from "../store/hydrateStores";

const headerLeft = (
  <h1 className="text-xl font-bold text-gray-900">
    <a href="/" data-link="/">
      쇼핑몰
    </a>
  </h1>
);

// 무한 스크롤 이벤트 등록
let scrollHandlerRegistered = false;

const registerScrollHandler = () => {
  if (scrollHandlerRegistered) return;

  window.addEventListener("scroll", loadNextProducts);
  scrollHandlerRegistered = true;
};

const unregisterScrollHandler = () => {
  if (!scrollHandlerRegistered) return;
  window.removeEventListener("scroll", loadNextProducts);
  scrollHandlerRegistered = false;
};

export interface HomePageProps {
  initialData?: ProductsSSRResult | null;
}

export const HomePage = ({ initialData }: HomePageProps) => {
  // console.log("HomePage initialData", initialData);

  // console.log("ProductDetailPage 초기화가 되었는지 확인용", productStore.getState());

  // if (typeof window === "undefined" && initialData && initialData.products.length > 0) {
  //   hydrateStores(initialData);
  // }

  useEffect(() => {
    registerScrollHandler();

    const state = productStore.getState();

    // ✅ 스토어 상태를 보고 초기 데이터 유무를 판단
    if (!state.products || state.products.length === 0) {
      console.log("🔥 스토어 비어있음 → API 호출");
      loadProductsAndCategories();
    } else {
      console.log("🔥 스토어에 SSR 데이터 있음 → fetch 스킵");
    }

    return unregisterScrollHandler;
  }, []);

  return (
    <PageWrapper headerLeft={headerLeft}>
      {/* 검색 및 필터 */}
      <SearchBar />

      {/* 상품 목록 */}
      <div className="mb-6">
        <ProductList />
      </div>
    </PageWrapper>
  );
};
