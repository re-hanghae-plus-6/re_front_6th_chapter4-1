import { useEffect } from "react";
import { ProductList, SearchBar, useProductStoreContext } from "../entities";
import { PageWrapper } from "./PageWrapper";
import { withServerSideProps } from "../utils";
import { getProducts, getCategories } from "../api/productApi";
import { hasInitialData, hasStoreData } from "../utils/hydration";

const headerLeft = (
  <h1 className="text-xl font-bold text-gray-900">
    <a href="/" data-link="/">
      쇼핑몰
    </a>
  </h1>
);

export const HomePage = withServerSideProps(
  {
    ssr: async ({ query }) => {
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
  () => {
    const {
      action: { loadProductsAndCategories, loadNextProducts },
    } = useProductStoreContext();

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

    useEffect(() => {
      registerScrollHandler();

      if (!hasInitialData() && !hasStoreData()) {
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
  },
);
