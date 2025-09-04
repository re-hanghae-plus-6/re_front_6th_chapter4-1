import { useRouterParams } from "../../../../router";
import { useEffect } from "react";
import { loadProductDetailForPage } from "../../productUseCase";

export const useLoadProductDetail = (shouldLoad: boolean = true) => {
  const productId = useRouterParams((params) => params.id) as string;
  useEffect(() => {
    if (shouldLoad) {
      loadProductDetailForPage(productId);
    }
  }, [productId, shouldLoad]);
};
