import { useRouterParams } from "../../../../router";
import { useEffect } from "react";
import { loadProductDetailForPage } from "../../productUseCase";

export const useLoadProductDetail = (enable: boolean = true) => {
  const productId = useRouterParams((params) => params?.id);
  useEffect(() => {
    // 데이터가 있으면 데이터를 불러오지 않는다
    if (!enable || !productId) return;
    loadProductDetailForPage(productId as string);
  }, [productId, enable]);
};
