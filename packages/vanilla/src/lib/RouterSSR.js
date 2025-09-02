/**
 * 서버 사이드 렌더링용 라우터
 */
export class RouterSSR {
  #routes;
  #baseUrl;

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#baseUrl = baseUrl.replace(/\/$/, "");
  }

  get baseUrl() {
    return this.#baseUrl;
  }

  get query() {
    return {};
  }

  set query(newQuery) {
    // SSR에서는 쿼리 변경 불가
  }

  get params() {
    return {};
  }

  get route() {
    return null;
  }

  get target() {
    return null;
  }

  subscribe(fn) {
    // SSR에서는 구독 불가
  }

  /**
   * 라우트 등록 (SSR에서는 실제로 사용되지 않음)
   * @param {string} path - 경로 패턴
   * @param {Function} handler - 라우트 핸들러
   */
  addRoute(path, handler) {
    // SSR에서는 라우트 등록만 하고 실제 매칭은 서버에서 처리
    this.#routes.set(path, handler);
  }

  /**
   * 네비게이션 (SSR에서는 사용되지 않음)
   * @param {string} url - 이동할 경로
   */
  push(url) {
    // SSR에서는 네비게이션 불가
  }

  /**
   * 라우터 시작 (SSR에서는 사용되지 않음)
   */
  start() {
    // SSR에서는 시작 불가
  }

  /**
   * 쿼리 파라미터를 객체로 파싱
   * @param {string} search - 쿼리 문자열
   * @returns {Object} 파싱된 쿼리 객체
   */
  static parseQuery = (search = "") => {
    const params = new URLSearchParams(search);
    const query = {};
    for (const [key, value] of params) {
      query[key] = value;
    }
    return query;
  };

  /**
   * 객체를 쿼리 문자열로 변환
   * @param {Object} query - 쿼리 객체
   * @returns {string} 쿼리 문자열
   */
  static stringifyQuery = (query) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
    return params.toString();
  };

  static getUrl = (newQuery, baseUrl = "", pathname = "/") => {
    const updatedQuery = { ...newQuery };

    // 빈 값들 제거
    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = RouterSSR.stringifyQuery(updatedQuery);
    return `${baseUrl}${pathname}${queryString ? `?${queryString}` : ""}`;
  };
}
