import { useEffect } from "react";
import { getProducts, getCategories } from "../../api/productApi";
import { loadNextProducts, SearchBar, ProductList, type ProductStoreState, initialProductState } from "../../entities";
import type { GlobalSnapshot } from "../../global";
import { PageWrapper } from "../PageWrapper";
import { type GenerateMetaData, useRouterContext, type GetServerSideProps } from "../../core/router";

/* eslint-disable react-refresh/only-export-components */
export const generateMetaData: GenerateMetaData = async () => {
  return {
    metadata: { title: "쇼핑몰 - 홈" },
  };
};

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

export const PageComponent = () => {
  const router = useRouterContext();
  useEffect(() => {
    registerScrollHandler();

    return unregisterScrollHandler;
  }, [router]);

  return (
    <PageWrapper
      headerLeft={
        <h1 className="text-xl font-bold text-gray-900">
          <a href="/" data-link="/">
            쇼핑몰
          </a>
        </h1>
      }
    >
      {/* 검색 및 필터 */}
      <SearchBar />

      {/* 상품 목록 */}
      <div className="mb-6">
        <ProductList />
      </div>
    </PageWrapper>
  );
};

export const getServerSideProps: GetServerSideProps<GlobalSnapshot> = async ({ query }) => {
  try {
    const [productsData, categoriesData] = await Promise.all([getProducts(query), getCategories()]);

    const productStoreState = {
      products: productsData.products,
      categories: categoriesData,
      totalCount: productsData.pagination.total,
      loading: false,
      error: null,
      currentProduct: null,
      relatedProducts: [],
      status: "done",
    } satisfies ProductStoreState;

    return {
      props: {
        snapshots: {
          productStore: { ...initialProductState, ...productStoreState },
        },
      },
    };
  } catch (error) {
    console.error("HomePage prefetch error:", error);
    return {
      props: {
        snapshots: {
          productStore: initialProductState,
        },
      },
    };
  }
};
