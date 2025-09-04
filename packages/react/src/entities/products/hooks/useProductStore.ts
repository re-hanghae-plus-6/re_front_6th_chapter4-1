import { useStore } from "@hanghae-plus/lib";
import { PRODUCT_ACTIONS, productStore } from "../productStore";
import { type PropsWithChildren } from "react";
import type { Categories, Product } from "../types";

export const useProductStore = () => useStore(productStore);

interface ProductProviderProps {
  initialData?: {
    products?: Product[];
    categories?: Categories;
    totalCount?: number;
    currentProduct?: Product;
    relatedProducts?: Product[];
    filters: {
      search: string;
      limit: string;
      sort: string;
      category1: string;
      category2: string;
    };
  };
}

export const ProductProvider = ({ children, initialData }: PropsWithChildren<ProductProviderProps>) => {
  // useEffect 대신 즉시 실행

  if (initialData?.currentProduct || (initialData?.products && initialData.products.length > 0)) {
    // 현재 스토어 상태 확인
    const currentState = productStore.getState();
    console.log("데이터000");
    // console.log(initialData?.currentProduct);
    console.log(currentState.products.length);
    console.log(currentState.currentProduct);

    // 아직 초기 데이터가 설정되지 않았을 때만 설정
    if (currentState.loading === true || typeof window === "undefined") {
      console.log("데이터");
      console.log(initialData?.currentProduct);

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SET_INITIAL_DATA,
        payload: {
          products: initialData.products,
          categories: initialData.categories || {},
          totalCount: initialData.totalCount || (initialData?.products ?? []).length,
          currentProduct: initialData.currentProduct || {},
          relatedProducts: initialData.relatedProducts || [],
          filters: initialData.filters,
          loading: false,
        },
      });
    }
  }

  return children;
};
