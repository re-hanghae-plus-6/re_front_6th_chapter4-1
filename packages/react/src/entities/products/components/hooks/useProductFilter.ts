import { useEffect } from "react";
import { useRouterQuery } from "../../../../router";
import { loadProducts } from "../../productUseCase";

export const useProductFilter = () => {
  const { search: searchQuery, limit, sort, category1, category2 } = useRouterQuery();
  const category = { category1, category2 };

  useEffect(() => {
    if (typeof window !== "undefined" && window.__INITIAL_DATA__) {
      return;
    }
    loadProducts(true);
  }, [searchQuery, limit, sort, category1, category2]);

  return {
    searchQuery,
    limit,
    sort,
    category,
  };
};
