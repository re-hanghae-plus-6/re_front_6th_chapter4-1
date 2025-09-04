import { BaseRouter } from "../lib";

/**
 * 서버사이드 라우터 - SSR 환경에서 사용
 */

export class ServerRouter extends BaseRouter {
  #currentUrl = "/"; // 현재 처리 중인 요청 URL
  #origin = "http://localhost"; // 서버 origin
  #query = {}; // Express에서 파싱된 쿼리 객체

  constructor(baseUrl = "") {
    super(baseUrl);
  }

  // 현재 쿼리 파라미터 반환
  get query() {
    return this.#query;
  }

  // Express에서 파싱된 쿼리 객체 직접 저장 (클라이언트와 다름)
  set query(newQuery) {
    this.#query = newQuery || {};
  }

  // 설정된 현재 URL 반환
  getCurrentUrl() {
    return this.#currentUrl;
  }

  // 설정된 서버 origin 반환
  getOrigin() {
    return this.#origin;
  }

  /**
   * 서버 요청 URL과 origin 설정
   */
  setUrl(url, origin = "http://localhost") {
    this.#currentUrl = url;
    this.#origin = origin;
    this.updateRoute(this.getCurrentUrl()); // 라우트 매칭 수행
  }

  /**
   * 서버사이드에서는 페이지 이동 불가 - 에러 발생
   */
  push() {
    throw new Error("Navigation is not supported in server-side routing");
  }

  /**
   * 라우터 초기화 - 현재 설정된 URL로 라우팅
   */
  start() {
    this.updateRoute(this.getCurrentUrl());
  }
}
