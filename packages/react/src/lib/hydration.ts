/* eslint-disable @typescript-eslint/no-explicit-any */
import { PRODUCT_ACTIONS, productStore } from "../entities/products/productStore";

/**
 * 서버에서 전달받은 초기 데이터를 클라이언트 store에 하이드레이션
 */
export const hydrateStore = () => {
  // window 객체가 존재하고 __INITIAL_DATA__가 있는지 확인
  if (typeof window !== "undefined" && window.__INITIAL_DATA__) {
    const initialData = window.__INITIAL_DATA__;

    // productStore에 초기 데이터 설정
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: initialData,
    });

    // 하이드레이션 완료 후 초기 데이터 제거 (메모리 해제)
    delete window.__INITIAL_DATA__;
  }
};

// 타입 선언
declare global {
  interface Window {
    __INITIAL_DATA__?: any;
  }
}
