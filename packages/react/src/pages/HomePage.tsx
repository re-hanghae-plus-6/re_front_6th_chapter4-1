import { useEffect } from "react";
import { loadNextProducts, loadProductsAndCategories, ProductList, SearchBar } from "../entities";
import { PageWrapper } from "./PageWrapper";
import type { SSRPageComponent, SSRContext, MetaData } from "../types/ssr";
import { getProducts, getCategories } from "../api/productApi";

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

interface HomePageProps {
  ssrData?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    products: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    categories: any;
    totalCount: number;
  };
}

const HomePageComponent: SSRPageComponent<HomePageProps> = ({ ssrData }) => {
  useEffect(() => {
    registerScrollHandler();

    // SSR 데이터가 없는 경우에만 클라이언트에서 데이터 로드
    if (!ssrData) {
      loadProductsAndCategories();
    }

    return unregisterScrollHandler;
  }, [ssrData]);

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

// SSR 메서드 - 로딩 상태 없이 완전한 데이터 반환
HomePageComponent.ssr = async ({ query }: SSRContext) => {
  try {
    // SSR에서도 클라이언트와 동일한 정렬 기준 사용
    const queryWithSort = { ...query, sort: query.sort || "price_asc" };
    const [productsResponse, categories] = await Promise.all([getProducts(queryWithSort), getCategories()]);

    console.log("홈페이지 SSR 데이터 로드 완료:", {
      productsCount: productsResponse.products.length,
      totalCount: productsResponse.pagination.total,
      categoriesCount: Object.keys(categories).length,
    });

    // SSR에서는 로딩 상태 없이 완전한 데이터만 반환
    return {
      products: productsResponse.products,
      categories,
      totalCount: productsResponse.pagination.total,
    };
  } catch (error) {
    console.error("홈페이지 SSR 데이터 로드 실패:", error);
    // 에러 발생 시에도 기본 데이터 구조 유지
    return {
      products: [],
      categories: {},
      totalCount: 0,
    };
  }
};

// 메타데이터 생성
HomePageComponent.metadata = ({ query }: { query?: Record<string, string> } = {}): MetaData => {
  const searchQuery = query?.search;

  if (searchQuery) {
    return {
      title: `"${searchQuery}" 검색 결과 - 쇼핑몰`,
      description: `"${searchQuery}"에 대한 상품 검색 결과를 확인하세요.`,
      keywords: `${searchQuery}, 쇼핑, 온라인 쇼핑몰`,
    };
  }

  return {
    title: "쇼핑몰 - 홈",
    description: "다양한 상품을 만나보세요. 최고의 가격으로 제공하는 온라인 쇼핑몰입니다.",
    keywords: "쇼핑, 온라인 쇼핑몰, 상품, 할인",
  };
};

export const HomePage = HomePageComponent;
