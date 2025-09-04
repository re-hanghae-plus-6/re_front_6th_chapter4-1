import { isServer } from "../utils";
import { routerInstance } from "./router";

/**
 * 서버사이드 렌더링과 클라이언트 하이드레이션을 처리하는 HOC
 *
 * @param {function} PageComponent - 렌더링할 페이지 컴포넌트
 * @returns {function} SSR 지원 페이지 컴포넌트
 */
export const withUniversal = (PageComponent) => {
  const UniversalPageComponent = (serverProps) => {
    if (isServer()) {
      return PageComponent(serverProps);
    }

    const props = {
      query: routerInstance.query,
      data: window.__INITIAL_DATA__ || null,
    };

    delete window.__INITIAL_DATA__;

    return PageComponent(props);
  };

  return UniversalPageComponent;
};
