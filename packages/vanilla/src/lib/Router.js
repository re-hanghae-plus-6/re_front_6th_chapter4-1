/**
 * 클라이언트사이드 SPA 라우터
 */
import { BaseRouter } from "./BaseRouter.js";

export class Router extends BaseRouter {
  constructor(baseUrl = "") {
    super(baseUrl);

    // 브라우저 뒤로가기/앞으로가기 버튼 처리
    window.addEventListener("popstate", () => {
      this.updateRoute(this.getCurrentUrl());
    });
  }

  // 현재 URL의 쿼리 파라미터 반환
  get query() {
    return BaseRouter.parseQuery(window.location.search);
  }

  // 쿼리 파라미터 변경 시 URL 업데이트
  set query(newQuery) {
    const newUrl = BaseRouter.getUrl(newQuery, this.baseUrl, window.location.pathname, window.location.search);
    this.push(newUrl);
  }

  // 현재 브라우저 URL 반환 (경로 + 쿼리)
  getCurrentUrl() {
    return `${window.location.pathname}${window.location.search}`;
  }

  // 현재 브라우저 origin 반환
  getOrigin() {
    return window.location.origin;
  }

  /**
   * 새 페이지로 이동 (히스토리에 추가)
   */
  push(url) {
    try {
      // baseUrl 포함한 완전한 URL 생성
      let fullUrl = url.startsWith(this.baseUrl) ? url : this.baseUrl + (url.startsWith("/") ? url : "/" + url);

      const prevFullUrl = `${window.location.pathname}${window.location.search}`;

      // 현재 URL과 다른 경우에만 히스토리 추가
      if (prevFullUrl !== fullUrl) {
        window.history.pushState(null, "", fullUrl);
      }

      this.updateRoute(fullUrl);
    } catch (error) {
      console.error("라우터 네비게이션 오류:", error);
    }
  }

  /**
   * 라우터 초기화 - 현재 URL로 라우팅 시작
   */
  start() {
    this.updateRoute(this.getCurrentUrl());
  }
}
