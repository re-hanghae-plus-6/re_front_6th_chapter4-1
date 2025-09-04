import { useEffect } from "react";
import { loadNextProducts, loadProductsAndCategories, ProductList, SearchBar } from "../entities";
import { PageWrapper } from "./PageWrapper";

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

export const HomePage = () => {
  useEffect(() => {
    registerScrollHandler();

    // SSG로 초기 데이터가 있으면 API 호출 스킵
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const hasInitialData = (window as any)?.__INITIAL_DATA__?.products;
    if (!hasInitialData) {
      loadProductsAndCategories();
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
