import { useEffect, useRef } from "react";
import { useRouterQuery } from "../../../../router";
import { loadProducts } from "../../productUseCase";
import { productStore } from "../../productStore";

export const useProductFilter = () => {
  const { search: searchQuery, limit, sort, category1, category2 } = useRouterQuery();
  const category = { category1, category2 };

  const didMount = useRef(false);

  useEffect(() => {
    const state = productStore.getState();

    if (!didMount.current) {
      didMount.current = true;
      // SSR 초기 데이터가 있으면 첫 로딩만 스킵
      if (state.products.length > 0 && state.status === "done") {
        console.log("🔥 SSR 초기 데이터 감지 → 첫 로딩만 스킵");
        return;
      }
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
