import { useEffect } from "react";
import { loadProducts } from "../../productUseCase";
import { useRouterQuery } from "../../../../hooks";

export const useProductFilter = () => {
  const { search: searchQuery, limit, sort, category1, category2 } = useRouterQuery();
  const category = { category1, category2 };

  useEffect(() => {
    loadProducts(true);
  }, [searchQuery, limit, sort, category1, category2]);

  return {
    searchQuery,
    limit,
    sort,
    category,
  };
};
