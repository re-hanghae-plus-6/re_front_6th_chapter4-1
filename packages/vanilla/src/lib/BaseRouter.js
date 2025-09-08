import { createObserver } from "./createObserver.js";

/**
 * 기본 라우터 - 공통 기능을 제공하는 추상 클래스
 */
export class BaseRouter {
  #routes = new Map();
  #route = null;
  #observer = createObserver();
  #baseUrl;

  constructor(baseUrl = "") {
    this.#baseUrl = baseUrl.replace(/\/$/, "");
  }

  // 게터들 - 외부에서 내부 상태 접근
  get baseUrl() {
    return this.#baseUrl;
  }
  get params() {
    return this.#route?.params ?? {};
  } // URL 파라미터 (예: {id: "123"})
  get route() {
    return this.#route;
  } // 현재 라우트 정보
  get target() {
    return this.#route?.handler;
  } // 현재 라우트 핸들러

  // 라우트 변경 구독
  subscribe(fn) {
    this.#observer.subscribe(fn);
  }

  /**
   * 라우트 등록 (예: "/product/:id" -> 정규식으로 변환)
   */
  addRoute(path, handler) {
    const paramNames = [];

    // ":id" 같은 파라미터를 정규식 그룹으로 변환
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1)); // ":"제거하고 파라미터명 저장
        return "([^/]+)"; // 슬래시 제외한 모든 문자 매칭
      })
      .replace(/\//g, "\\/"); // 슬래시 이스케이프

    this.#routes.set(path, {
      regex: new RegExp(`^${regexPath}$`),
      paramNames,
      handler,
    });
  }

  /**
   * URL과 매칭되는 라우트 찾기
   */
  findRoute(url) {
    try {
      const { pathname } = new URL(url || "/", this.getOrigin());
      // baseUrl이 있으면 pathname에서 제거
      const normalizedPath = this.#baseUrl ? pathname.replace(this.#baseUrl, "") || "/" : pathname;

      // 등록된 라우트들과 매칭 시도
      for (const [routePath, route] of this.#routes) {
        const match = normalizedPath.match(route.regex);
        if (match) {
          // 파라미터 값들 추출
          const params = {};
          route.paramNames.forEach((name, index) => {
            params[name] = match[index + 1]; // 첫 번째 그룹부터 파라미터
          });

          return { ...route, params, path: routePath };
        }
      }
      return null; // 매칭되는 라우트 없음
    } catch {
      return null; // URL 파싱 실패
    }
  }

  /**
   * 라우트 업데이트하고 구독자들에게 알림
   */
  updateRoute(url) {
    this.#route = this.findRoute(url);
    this.#observer.notify();
  }

  // 추상 메서드들 - 하위 클래스에서 반드시 구현
  getCurrentUrl() {
    throw new Error("getCurrentUrl must be implemented by subclass");
  }

  getOrigin() {
    throw new Error("getOrigin must be implemented by subclass");
  }

  /**
   * 쿼리 스트링을 객체로 변환 (?a=1&b=2 -> {a:'1', b:'2'})
   */
  static parseQuery(search) {
    return Object.fromEntries(new URLSearchParams(search));
  }

  /**
   * 객체를 쿼리 스트링으로 변환 ({a:'1', b:'2'} -> "a=1&b=2")
   */
  static stringifyQuery(query) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value != null && value !== "") {
        // null, undefined, 빈값 제외
        params.set(key, String(value));
      }
    });
    return params.toString();
  }

  /**
   * 새 쿼리와 기존 쿼리를 병합해서 완전한 URL 생성
   */
  static getUrl(newQuery, baseUrl = "", pathname = "", search = "") {
    const updatedQuery = { ...this.parseQuery(search), ...newQuery };

    // null, undefined, 빈값 제거
    Object.keys(updatedQuery).forEach((key) => {
      if (updatedQuery[key] == null || updatedQuery[key] === "") {
        delete updatedQuery[key];
      }
    });

    const queryString = this.stringifyQuery(updatedQuery);
    return `${baseUrl}${pathname.replace(baseUrl, "")}${queryString ? `?${queryString}` : ""}`;
  }
}
