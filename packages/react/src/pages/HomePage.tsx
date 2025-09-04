import { useEffect } from "react";
import { getCategories, getProducts } from "../api/productApi";
import { ProductList, SearchBar, loadNextProducts, loadProductsAndCategories } from "../entities";
import { productStore } from "../entities/products/productStore";
import type { RouteParams } from "../router/ServerRouter";
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

    // 서버에서 하이드레이션된 데이터가 있는지 확인
    // status가 'done'이면 이미 데이터가 로드된 상태
    const { status, products } = productStore.getState();
    const isHydrated = status === "done" && products.length > 0;

    // 하이드레이션되지 않은 경우에만 데이터 로드
    if (!isHydrated) {
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

HomePage.prefetch = async ({ query }: RouteParams) => {
  const [
    {
      products,
      pagination: { total },
    },
    categories,
  ] = await Promise.all([getProducts(query), getCategories()]);

  return {
    products,
    categories,
    totalCount: total,
  };
};

HomePage.meta = () => `<title>쇼핑몰 - 홈</title>`;
