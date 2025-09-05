import { useRouterParams } from "../../../../router";
import { useEffect } from "react";
import { loadProductDetailForPage } from "../../productUseCase";

export const useLoadProductDetail = () => {
  const productId = useRouterParams((params) => params.id);
  useEffect(() => {
    if (typeof window === "undefined") return;
    loadProductDetailForPage(productId);
  }, [productId]);
};
