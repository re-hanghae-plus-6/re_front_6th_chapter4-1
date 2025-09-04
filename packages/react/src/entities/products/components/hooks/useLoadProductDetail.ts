import { useEffect } from "react";
import { useRouterParams } from "../../../../router";
import { productStore } from "../../productStore";
import { loadProductDetailForPage } from "../../productUseCase";

export const useLoadProductDetail = () => {
  const productId = useRouterParams((params) => params.id);

  useEffect(() => {
    if (!productId) return;

    // 서버에서 하이드레이션된 데이터가 있는지 확인
    const { currentProduct, status } = productStore.getState();
    const isHydrated = status === "done" && currentProduct?.productId === productId;

    // 하이드레이션되지 않은 경우에만 데이터 로드
    if (!isHydrated) {
      loadProductDetailForPage(productId);
    }
  }, [productId]);
};
