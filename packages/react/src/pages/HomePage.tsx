import { useEffect, type FC } from "react";
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
  if (scrollHandlerRegistered || typeof window === "undefined") return;

  window.addEventListener("scroll", loadNextProducts);
  scrollHandlerRegistered = true;
};

const unregisterScrollHandler = () => {
  if (!scrollHandlerRegistered || typeof window === "undefined") return;
  window.removeEventListener("scroll", loadNextProducts);
  scrollHandlerRegistered = false;
};

interface HomePageProps {
  searchQuery?: string;
  limit?: string;
  sort?: string;
  category1?: string;
  category2?: string;
}

export const HomePage: FC<HomePageProps> = ({ searchQuery, limit, sort, category1, category2 } = {}) => {
  useEffect(() => {
    registerScrollHandler();
    loadProductsAndCategories();

    return unregisterScrollHandler;
  }, []);

  return (
    <PageWrapper headerLeft={headerLeft}>
      {/* 검색 및 필터 */}
      <SearchBar
        initialSearchQuery={searchQuery}
        initialLimit={limit}
        initialSort={sort}
        initialCategory1={category1}
        initialCategory2={category2}
      />

      {/* 상품 목록 */}
      <div className="mb-6">
        <ProductList />
      </div>
    </PageWrapper>
  );
};
