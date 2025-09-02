import { useEffect } from "react";
import { useRouterQuery } from "../../../../router";
import { loadProducts } from "../../productUseCase";

export const useProductFilter = () => {
  const { search, limit, sort, category1, category2 } = useRouterQuery();
  const category = { category1, category2 };

  useEffect(() => {
    loadProducts({ search, limit, sort, category1, category2 }, true);
  }, [search, limit, sort, category1, category2]);

  return {
    searchQuery: search,
    limit,
    sort,
    category,
  };
};
