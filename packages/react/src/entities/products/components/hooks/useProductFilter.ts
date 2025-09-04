import { useEffect } from "react";
import { useRouterQuery } from "../../../../router";
import { useServerRouter } from "../../../../router/ServerRouterContext";
import { loadProducts } from "../../productUseCase";

export const useProductFilter = () => {
  const serverRouter = useServerRouter();
  const clientQuery = useRouterQuery();

  // 서버 환경이거나 서버 컨텍스트에 쿼리가 있으면 서버 쿼리 사용
  const hasServerQuery = typeof window === "undefined" || Object.keys(serverRouter.query).length > 0;
  const query = hasServerQuery ? serverRouter.query : clientQuery;
  const { search: searchQuery, limit, sort, category1, category2 } = query;
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
