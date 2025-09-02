import type { RouterInstance } from "@hanghae-plus/lib";
import { useEffect, useState, type FC } from "react";
import { getCategories, getProducts } from "../api/productApi";
import {
  initialProductState,
  loadNextProducts,
  loadProductsAndCategories,
  PRODUCT_ACTIONS,
  ProductList,
  productStore,
  SearchBar,
  type Categories,
  type Product,
} from "../entities";
import { useRouterContext } from "../router/hooks/useRouterContext";
import { withServer } from "../router/withServer";
import { isServer } from "../utils";
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

const registerScrollHandler = (router: RouterInstance<FC>) => {
  if (scrollHandlerRegistered) return;

  window.addEventListener("scroll", () => loadNextProducts(router));
  scrollHandlerRegistered = true;
};

const unregisterScrollHandler = (router: RouterInstance<FC>) => {
  if (!scrollHandlerRegistered) return;
  window.removeEventListener("scroll", () => loadNextProducts(router));
  scrollHandlerRegistered = false;
};

interface ServerResponse {
  products: Product[];
  categories: Categories;
  totalCount: number;
  loading: boolean;
  status: string;
}

export const HomePage = withServer(
  {
    ssr: async ({ query }): Promise<ServerResponse> => {
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
        loading: false,
        status: "done",
      };
    },
    metadata: async () => {
      return {
        title: "쇼핑몰 - 홈",
      };
    },
  },
  ({ data }: { data: ServerResponse }) => {
    useState(() => {
      if (isServer) {
        productStore.dispatch({
          type: PRODUCT_ACTIONS.SETUP,
          payload: initialProductState,
        });
      }
      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: data,
      });
    });
    const router = useRouterContext();

    useEffect(() => {
      registerScrollHandler(router);
      if (!data) {
        loadProductsAndCategories(router);
      }

      return () => unregisterScrollHandler(router);
    }, [router, data]);

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
  },
);
