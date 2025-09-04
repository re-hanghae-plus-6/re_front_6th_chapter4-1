import { useEffect } from "react";
import { useRouterQuery } from "../../../../hooks";
import { useProductStoreContext } from "../../hooks";

export const useProductFilter = () => {
  const { action } = useProductStoreContext();
  const { search: searchQuery, limit, sort, category1, category2 } = useRouterQuery();
  const category = { category1, category2 };

  useEffect(() => {
    action.loadProducts(true);
  }, [searchQuery, limit, sort, category1, category2]);

  return {
    searchQuery,
    limit,
    sort,
    category,
  };
};
