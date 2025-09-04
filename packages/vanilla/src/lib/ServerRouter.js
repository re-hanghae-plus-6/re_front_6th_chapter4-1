/**
 * 서버사이드 라우터 - window 객체가 없는 SSR 환경에서 사용
 */
export class ServerRouter {
  #routes;
  #route;
  #baseUrl;
  #currentQuery = {};

  // 모든 라우트 설정 초기화 (라우트 저장소, 활성 라우트, url)
  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#route = null;
    this.#baseUrl = baseUrl.replace(/\/$/, "");
  }

  // 현재 설정된 쿼리 파라미터를 반환 (서버 환경에서는 직접 관리)
  get query() {
    return this.#currentQuery;
  }

  // 새 쿼리 파라미터로 URL 생성하고 라우팅 업데이트
  set query(newQuery) {
    const newUrl = ServerRouter.getUrl(newQuery, this.#baseUrl);
    this.push(newUrl);
  }

  // 현재 라우트의 경로 파라미터 반환 (예: /product/:id에서 {id: "123"})
  get params() {
    return this.#route?.params ?? {};
  }

  // 현재 매칭된 라우트 정보 반환
  get route() {
    return this.#route;
  }

  // 현재 라우트의 핸들러 함수 반환
  get target() {
    return this.#route?.handler;
  }

  /**
   * 서버사이드 네비게이션 실행 - URL 변경 시 호출
   * (브라우저와 달리 히스토리 API 사용하지 않고 내부 상태만 업데이트)
   * @param {string} url - 이동할 경로 (기본값: "/")
   */
  push(url = "/") {
    try {
      // 주어진 URL에 매칭되는 라우트를 찾아서 현재 라우트로 설정
      this.#route = this.#findRoute(url);
    } catch (error) {
      console.error("서버 네비게이션 오류:", error);
    }
  }

  /**
   * 서버 라우터 초기화 및 시작 - SSR 렌더링 시작점에서 호출
   * 쿼리 파라미터를 설정하고 url에 매칭되는 라우트 적용
   * @param {string} url - 초기 URL 경로 (기본값: "/")
   * @param {object} query - 초기 쿼리 파라미터 객체 (기본값: {})
   */
  start(url = "/", query = {}) {
    this.#currentQuery = query;
    this.#route = this.#findRoute(url);
  }

  /**
   * 라우트 등록 - URL 패턴과 핸들러 함수를 매핑
   * @param {string} path - 경로 패턴 (예: "/product/:id")
   * @param {Function} handler - 라우트 핸들러 함수
   */
  addRoute(path, handler) {
    // 동적 파라미터를 정규식으로 변환하는 과정
    const paramNames = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1)); // ':id' -> 'id'로 변환해서 저장
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    // baseUrl과 regexPath 사이의 중복 슬래시 제거
    const normalizedPath = `${this.#baseUrl}${regexPath}`.replace(/\/+/g, "/");
    const regex = new RegExp(`^${normalizedPath}$`);

    // 라우트 정보를 Map에 저장
    this.#routes.set(path, {
      regex,
      paramNames,
      handler,
    });
  }

  /**
   * 주어진 URL과 매칭되는 라우트를 찾아서 반환
   * @param {string} url - 매칭할 URL (기본값: "/")
   * @param {string} origin - 서버 도메인 (기본값: "http://localhost")
   * @returns {Object|null} 매칭된 라우트 정보 또는 null
   */
  #findRoute(url = "/", origin = "http://localhost") {
    // URL 객체를 생성해서 pathname 추출 (쿼리스트링, 해시 제외)
    const { pathname } = new URL(url, origin);

    // 등록된 모든 라우트를 순회하며 매칭 확인
    for (const [routePath, route] of this.#routes) {
      const match = pathname.match(route.regex); // 정규식으로 URL 패턴 매칭

      if (match) {
        // 매칭된 동적 파라미터들을 객체로 변환
        // 예: /product/123 → {id: "123"}
        const params = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        // 라우트 정보와 추출된 파라미터를 함께 반환
        return {
          ...route,
          params,
          path: routePath,
        };
      }
    }

    return null;
  }

  /**
   * 쿼리 파라미터 문자열을 객체로 파싱
   * @param {string} search - location.search 또는 쿼리 문자열 (예: "?page=1&limit=20")
   * @returns {Object} 파싱된 쿼리 객체
   */
  static parseQuery = (search) => {
    const params = new URLSearchParams(search);
    const query = {};

    for (const [key, value] of params) {
      query[key] = value;
    }
    return query;
  };

  /**
   * 객체를 쿼리 문자열로 변환 (빈 값들은 제외)
   * @param {Object} query - 쿼리 객체 (예: {page: 1, search: "test"})
   * @returns {string} 쿼리 문자열 ("page=1&search=test" 형태)
   */
  static stringifyQuery = (query) => {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(query)) {
      // null, undefined, 빈 문자열이 아닌 값들만 추가
      if (value !== null && value !== undefined && value !== "") {
        params.set(key, String(value));
      }
    }
    return params.toString();
  };

  /**
   * 새로운 쿼리 파라미터와 기존 쿼리를 병합하여 완전한 URL 생성
   * @param {Object} newQuery - 새로 추가할 쿼리 객체
   * @param {string} pathname - 경로
   * @param {string} baseUrl - 베이스 URL
   * @returns {string} 완성된 URL (예: "/products?page=2&search=test")
   */
  static getUrl = (newQuery, pathname = "/", baseUrl = "") => {
    // 현재 쿼리 파라미터 가져오기
    const currentQuery = ServerRouter.parseQuery();
    // 기존 쿼리에 새 쿼리 병합
    const updatedQuery = { ...currentQuery, ...newQuery };

    // 빈 값들 제거 (null, undefined, 빈 문자열)
    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] === null || updatedQuery[key] === undefined || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = ServerRouter.stringifyQuery(updatedQuery);
    // 최종 URL 조합: baseUrl + pathname + queryString
    return `${baseUrl}${pathname.replace(baseUrl, "")}${queryString ? `?${queryString}` : ""}`;
  };
}
