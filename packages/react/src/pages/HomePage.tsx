import { useEffect } from "react";
import { loadNextProducts, loadProductsAndCategories, ProductList, SearchBar } from "../entities";
import { PageWrapper } from "./PageWrapper";
import type { ProductsSSRResult } from "../api/ssrProductApi";

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
  useEffect(() => {
    registerScrollHandler();
    loadProductsAndCategories();

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
