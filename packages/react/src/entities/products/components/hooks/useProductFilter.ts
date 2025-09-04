import { useEffect } from "react";
import { useRouterQuery } from "../../../../router";
import { loadProducts } from "../../productUseCase";
import { productStore } from "../../productStore";

export const useProductFilter = () => {
  const { search: searchQuery, limit, sort, category1, category2 } = useRouterQuery();
  const category = { category1, category2 };

  useEffect(() => {
    const state = productStore.getState();
    // SSR 초기 데이터가 있으면 첫 호출은 스킵
    if (state.products.length > 0 && (state.status === "done" || state.status === "pending")) {
      console.log("🔥 SSR 데이터 있음 → useProductFilter fetch 스킵");
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
