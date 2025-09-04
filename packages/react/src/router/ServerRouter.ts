import type { RouteInfo, SSRPageComponent } from "../types/ssr";

/**
 * 서버 사이드 라우터
 * 클라이언트 Router와 유사한 API를 제공하지만 서버 환경에 최적화됨
 * 바닐라 JavaScript ServerRouter를 React/TypeScript로 포팅
 */
export class ServerRouter {
  #routes: Map<string, RouteInfo>;
  #route: RouteInfo | null;
  #baseUrl: string;

  constructor(baseUrl = "") {
    this.#routes = new Map();
    this.#route = null;
    this.#baseUrl = baseUrl.replace(/\/$/, "");
  }

  get baseUrl(): string {
    return this.#baseUrl;
  }

  get params(): Record<string, string> {
    return this.#route?.params ?? {};
  }

  get route(): RouteInfo | null {
    return this.#route;
  }

  get target(): SSRPageComponent | undefined {
    return this.#route?.handler;
  }

  /**
   * 라우트 등록
   * @param path - 경로 패턴 (예: "/product/:id")
   * @param handler - 라우트 핸들러 (React 컴포넌트)
   */
  addRoute(path: string, handler: SSRPageComponent): void {
    const paramNames: string[] = [];

    // 경로 패턴을 정규식으로 변환 (바닐라와 동일한 로직)
    let regexPath;

    if (path === "*") {
      // 와일드카드는 모든 경로에 매치
      regexPath = ".*";
    } else {
      regexPath = path
        .replace(/:\w+/g, (match) => {
          paramNames.push(match.slice(1)); // ':id' -> 'id'
          return "([^/]+)";
        })
        .replace(/\//g, "\\/");
    }

    const regex = new RegExp(`^${regexPath}$`);

    console.log(`서버 라우트 등록: ${path} -> ${regex}`);

    this.#routes.set(path, {
      path,
      handler,
      paramNames,
      regex,
    });
  }

  /**
   * 라우트 매칭
   * @param url - 매칭할 URL
   * @returns 매칭된 라우트 정보 또는 null
   */
  findRoute(url: string): RouteInfo | null {
    const pathname = url.split("?")[0]; // 쿼리 파라미터 제거

    // baseUrl 제거 (서버에서 baseUrl이 제거된 경로로 전달되는 경우 처리)
    const normalizedPath = pathname.replace(this.#baseUrl, "") || "/";

    console.log("서버 라우트 찾기:", normalizedPath);
    console.log("등록된 서버 라우트들:", Array.from(this.#routes.keys()));

    // 구체적인 라우트부터 먼저 확인 (.* 라우트는 마지막에)
    // 바닐라와 동일한 순서로 매칭
    const routeOrder = ["/", "/product/:id/", ".*"];

    for (const routePath of routeOrder) {
      const route = this.#routes.get(routePath);
      if (route) {
        const match = normalizedPath.match(route.regex);
        console.log(`라우트 ${routePath} 매칭 시도:`, match);

        if (match) {
          const params: Record<string, string> = {};
          route.paramNames.forEach((name, index) => {
            params[name] = match[index + 1];
          });

          console.log("매칭된 라우트:", routePath, "파라미터:", params);

          return {
            ...route,
            params,
          };
        }
      }
    }

    return null;
  }

  /**
   * 라우터 시작 - URL을 기반으로 라우트 매칭
   * @param pathname - 현재 경로
   * @param query - 쿼리 파라미터 (사용하지 않지만 인터페이스 호환성)
   */
  start(pathname: string, query: Record<string, string> = {}): void {
    this.#route = this.findRoute(pathname);
    console.log("서버 라우터 시작:", { pathname, query, route: this.#route });
  }

  /**
   * 쿼리 파라미터를 객체로 파싱 (정적 메서드)
   * @param search - 쿼리 문자열
   * @returns 파싱된 쿼리 객체
   */
  static parseQuery(search = ""): Record<string, string> {
    const params = new URLSearchParams(search);
    const query: Record<string, string> = {};
    for (const [key, value] of params) {
      query[key] = value;
    }
    return query;
  }
}
