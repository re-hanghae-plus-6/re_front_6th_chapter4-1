import { useEffect } from "react";
import { getCategories, getProducts } from "../../api/productApi";
import { type GenerateMetaData, type GetServerSideProps, useRouterContext } from "../../core/router";
import { ProductList, SearchBar, useProductStoreContext } from "../../entities";
import type { GlobalInitialData } from "../../global";
import { PageWrapper } from "../PageWrapper";

/* eslint-disable react-refresh/only-export-components */
export const generateMetaData: GenerateMetaData = async () => {
  return {
    metadata: { title: "쇼핑몰 - 홈" },
  };
};

// 무한 스크롤 이벤트 등록
let scrollHandlerRegistered = false;

type Props = {
  isPrefetched?: boolean;
};

export const PageComponent = ({ isPrefetched = false }: Props) => {
  const router = useRouterContext();
  const { action } = useProductStoreContext();

  const registerScrollHandler = () => {
    if (scrollHandlerRegistered) return;

    window.addEventListener("scroll", action.loadNextProducts);
    scrollHandlerRegistered = true;
  };

  const unregisterScrollHandler = () => {
    if (!scrollHandlerRegistered) return;
    window.removeEventListener("scroll", action.loadNextProducts);
    scrollHandlerRegistered = false;
  };

  useEffect(() => {
    registerScrollHandler();

    return unregisterScrollHandler;
  }, [router]);

  useEffect(() => {
    if (isPrefetched) return;

    action.loadProductsAndCategories();
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

export const getServerSideProps: GetServerSideProps<GlobalInitialData> = async ({ query }) => {
  try {
    const [productsData, categoriesData] = await Promise.all([getProducts(query), getCategories()]);

    return {
      props: {
        initialData: {
          products: productsData.products,
          categories: categoriesData,
          totalCount: productsData.pagination.total,
          loading: false,
          error: null,
          currentProduct: null,
          relatedProducts: [],
          status: "done",
          query,
        },
      } satisfies GlobalInitialData,
    };
  } catch (err) {
    console.error("HomePage prefetch error:", err);
    const error = err as unknown as Error;
    return {
      props: {
        initialData: {
          products: [],
          categories: {},
          totalCount: 0,
          loading: false,
          error: error.message,
          currentProduct: null,
          relatedProducts: [],
          status: "error",
          query,
        },
      },
    };
  }
};
