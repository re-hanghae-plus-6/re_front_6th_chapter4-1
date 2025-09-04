/**
 * 서버사이드 라우터
 */
import { BaseRouter } from "./BaseRouter.js";

export class ServerRouter extends BaseRouter {
  #currentUrl = "/";
  #origin = "http://localhost";
  #query = {};

  constructor(baseUrl = "") {
    super(baseUrl);
  }

  get query() {
    return this.#query;
  }

  set query(newQuery) {
    // 서버사이드에서는 Express에서 이미 파싱된 쿼리 객체를 직접 저장
    this.#query = newQuery || {};
  }

  getCurrentUrl() {
    return this.#currentUrl;
  }

  getOrigin() {
    return this.#origin;
  }

  /**
   * 서버 URL 설정
   * @param {string} url - 요청 URL
   * @param {string} [origin] - 서버 origin (선택적)
   */
  setUrl(url, origin = "http://localhost") {
    this.#currentUrl = url;
    this.#origin = origin;
    this.updateRoute(this.getCurrentUrl());
  }

  /**
   * 서버사이드에서는 네비게이션 불가
   */
  push() {
    throw new Error("Navigation is not supported in server-side routing");
  }

  /**
   * 라우터 시작
   */
  start() {
    this.updateRoute(this.getCurrentUrl());
  }
}
