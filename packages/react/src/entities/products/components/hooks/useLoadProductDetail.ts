import { useEffect } from "react";
import { loadProductDetailForPage } from "../../productUseCase";
import { useRouterContext } from "../../../../core/router";

export const useLoadProductDetail = () => {
  const router = useRouterContext();
  useEffect(() => {
    loadProductDetailForPage(router.params.id);
  }, [router.params.id, router]);
};
