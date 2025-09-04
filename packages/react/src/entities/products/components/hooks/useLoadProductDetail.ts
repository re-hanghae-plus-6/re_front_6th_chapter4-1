import { useRouterParams } from "../../../../router";
import { useEffect } from "react";
import { useProductStoreContext } from "../../hooks";
import { hasInitialData, hasStoreData } from "../../../../utils/hydration";

export const useLoadProductDetail = () => {
  const {
    action: { loadProductDetailForPage },
  } = useProductStoreContext();
  const productId = useRouterParams((params) => params.id);
  useEffect(() => {
    loadProductDetailForPage(productId ?? "");
    if (!hasInitialData() && !hasStoreData()) {
      loadProductDetailForPage(productId ?? "");
    }
  }, [productId]);
};
