import { useEffect } from "react";
import { useRouterQuery } from "../../../../router";
import { loadProducts } from "../../productUseCase";
import { useProductStore } from "../../hooks";

export const useProductFilter = () => {
  const { filters } = useProductStore();
  const { search: searchQuery, limit, sort, category1, category2 } = useRouterQuery();
  const category = { category1, category2 };

  useEffect(() => {
    if (typeof window === "undefined") return;
    loadProducts(true);
  }, [searchQuery, limit, sort, category1, category2]);

  console.log("ㅅㅂ");
  console.log(filters);

  return {
    searchQuery: typeof window === "undefined" ? filters.search : searchQuery,
    limit: typeof window === "undefined" ? filters.limit : limit,
    sort: typeof window === "undefined" ? filters.sort : sort,
    category: typeof window === "undefined" ? { category1: filters.category1, category2: filters.category2 } : category,
  };
};
