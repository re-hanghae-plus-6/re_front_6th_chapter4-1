import { useEffect, useMemo } from "react";
import { useRouterQuery } from "../../../../router";
import { loadProducts } from "../../productUseCase";

export const useProductFilter = () => {
  const routerQuery = useRouterQuery();

  // SSR 쿼리 정보 가져오기 (클라이언트에서만)
  const ssrQuery = useMemo(() => {
    if (typeof window !== "undefined") {
      const initialData = (window as { __INITIAL_DATA__?: { __SSR_QUERY__?: Record<string, string> } })
        .__INITIAL_DATA__;
      return initialData?.__SSR_QUERY__ || {};
    }
    return {};
  }, []);

  console.log("🔍 useProductFilter 쿼리 정보:", {
    routerQuery,
    ssrQuery,
    hasSSRQuery: Object.keys(ssrQuery).length > 0,
  });

  // SSR 쿼리가 있으면 우선 사용, 없으면 라우터 쿼리 사용
  const hasSSRQuery = Object.keys(ssrQuery).length > 0;
  const effectiveQuery = hasSSRQuery ? ssrQuery : routerQuery;

  const { search: searchQuery = "", limit = "20", sort = "price_asc", category1 = "", category2 = "" } = effectiveQuery;

  const category = { category1, category2 };

  useEffect(() => {
    // SSR 데이터가 있는 첫 렌더링에서는 로드 생략
    if (hasSSRQuery) {
      console.log("SSR 쿼리 존재 - 첫 로드 생략");
      return;
    }

    console.log("useProductFilter 로드 실행:", { searchQuery, limit, sort, category1, category2 });
    loadProducts(true);
  }, [searchQuery, limit, sort, category1, category2, hasSSRQuery]);

  return {
    searchQuery,
    limit,
    sort,
    category,
  };
};
