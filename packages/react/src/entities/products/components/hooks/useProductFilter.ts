import { useEffect } from "react";
import { useRouterQuery } from "../../../../router";
import type { StringRecord } from "../../../../types";
import { loadProducts } from "../../productUseCase";

export const useProductFilter = () => {
  const { search: searchQuery, limit, sort, category1, category2 } = useRouterQuery() as unknown as StringRecord;
  const category = { category1, category2 };

  useEffect(() => {
    // SSR 하이드레이션 시에는 서버 데이터 유지
    if (typeof window !== "undefined" && window.__INITIAL_DATA__) return;
    loadProducts(true);
  }, [searchQuery, limit, sort, category1, category2]);

  return {
    searchQuery,
    limit,
    sort,
    category,
  };
};
