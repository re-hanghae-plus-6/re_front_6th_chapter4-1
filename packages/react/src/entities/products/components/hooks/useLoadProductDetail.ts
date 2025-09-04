import { useEffect } from "react";
import { useRouterParams } from "../../../../hooks";
import { useProductStoreContext } from "../../hooks";

export const useLoadProductDetail = () => {
  const { action } = useProductStoreContext();

  const productId = useRouterParams((params) => params.id);

  useEffect(() => {
    if (productId) {
      action.loadProductDetailForPage(productId);
    }
  }, [productId]);
};
