import { useRouterParams } from "../../../../router";
import { useEffect } from "react";
import { loadProductDetailForPage } from "../../productUseCase";

export const useLoadProductDetail = () => {
  const productId = useRouterParams((params) => params.id);
  useEffect(() => {
    if (productId) {
      loadProductDetailForPage(productId);
    }
  }, [productId]);
};
