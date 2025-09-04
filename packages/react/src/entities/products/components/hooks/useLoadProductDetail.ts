import { useEffect } from "react";
import { loadProductDetailForPage } from "../../productUseCase";
import { useRouterParams } from "../../../../router";

export const useLoadProductDetail = () => {
  const productId = useRouterParams((params) => params.id);
  useEffect(() => {
    if (!productId) return;
    loadProductDetailForPage(productId);
  }, [productId]);
};
