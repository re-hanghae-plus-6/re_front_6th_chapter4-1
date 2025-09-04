/**
 * 서버 전용 메모리 라우터
 * - 클라이언트 Router의 매칭 규칙을 그대로 따르되, window 의존 제거
 * - URL 문자열을 입력받아 라우트를 매칭하고 params/query를 추출
 */
import type {
  RouteHandler,
  RouteInfo,
  ServerMatchedRoute,
  ServerRouterInstance,
  GetServerSideProps,
  GenerateMetaData,
  GenerateMetaDataResult,
} from "./types";

export class ServerRouter implements ServerRouterInstance {
  #routes: Map<string, RouteInfo>;
  #route: ServerMatchedRoute | null;
  #baseUrl: string;

  /**
   * @param baseUrl 배포 베이스 경로 (예: "/front_6th_chapter4-1/vanilla")
   */
  constructor(baseUrl: string = "") {
    this.#routes = new Map();
    this.#route = null;
    this.#baseUrl = String(baseUrl).replace(/\/$/, "");
  }

  get baseUrl(): string {
    return this.#baseUrl;
  }

  get route(): ServerMatchedRoute | null {
    return this.#route;
  }

  get params(): Record<string, string> {
    return this.#route?.params ?? {};
  }

  get target(): RouteHandler | undefined {
    return this.#route?.handler;
  }

  get query(): Record<string, string> {
    return this.#route?.query ?? {};
  }

  /**
   * 라우트 등록
   * @param path 경로 패턴 (예: "/product/:id/")
   * @param handler 라우트 핸들러
   * @param getServerSideProps 서버사이드 props 함수
   */
  addRoute(
    path: string,
    handler: RouteHandler,
    options?: { getServerSideProps?: GetServerSideProps; generateMetaData?: GenerateMetaData },
  ): void {
    const paramNames: string[] = [];
    const regexPath = path
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1));
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    // baseUrl은 createContext 단계에서 제거되므로 정규식에는 포함하지 않음
    const regex = new RegExp(`^${regexPath}$`);

    this.#routes.set(path, {
      regex,
      paramNames,
      handler,
      getServerSideProps: options?.getServerSideProps,
      generateMetaData: options?.generateMetaData,
    });
  }

  /**
   * URL을 매칭하여 라우트/파라미터/쿼리를 반환
   * @param url 전체 경로 (예: "/product/123/?q=a") 또는 베이스 포함 경로
   */
  match(url: string): ServerMatchedRoute | null {
    // WHATWG URL 사용 (베이스는 로컬 도메인으로 임의 설정)
    const parsed = new URL(url, "http://localhost");
    const pathname = parsed.pathname;
    const search = parsed.search;

    for (const [routePath, route] of this.#routes) {
      const match = pathname.match(route.regex);
      if (match) {
        const params: Record<string, string> = {};
        route.paramNames.forEach((name, index) => {
          params[name] = match[index + 1];
        });

        const query = ServerRouter.parseQuery(search);

        return {
          ...route,
          params,
          query,
          path: routePath,
        };
      }
    }
    return null;
  }

  /**
   * 현재 라우트를 설정하고 결과를 반환
   * @param url
   */
  createContext(url: string): ServerMatchedRoute | null {
    this.#route = this.match(this.#stripBase(url));
    return this.#route;
  }

  /**
   * 서버에서 전달된 원본 URL에서 baseUrl을 제거 (정규화)
   * @param url
   */
  #stripBase(url: string): string {
    if (!this.#baseUrl) return url;
    const parsed = new URL(url, "http://localhost");
    const normalized = parsed.pathname.replace(this.#baseUrl, "") + parsed.search + parsed.hash;
    return normalized || "/";
  }

  /**
   * 서버사이드에서 데이터를 prefetch하는 함수
   * @param url 요청 URL
   * @returns prefetch된 데이터 또는 null
   */
  async prefetch(url: string): Promise<Record<string, unknown> | null> {
    const matchedRoute = this.match(this.#stripBase(url));

    if (!matchedRoute?.getServerSideProps) {
      return null;
    }

    try {
      const context = {
        params: matchedRoute.params,
        query: matchedRoute.query,
        url: url,
      };

      const result = await matchedRoute.getServerSideProps(context);
      return result.props;
    } catch (error) {
      console.error("Prefetch error:", error);
      return null;
    }
  }

  async generateMetaData(url: string): Promise<GenerateMetaDataResult | null> {
    const matchedRoute = this.match(this.#stripBase(url));
    if (!matchedRoute?.generateMetaData) {
      return null;
    }

    try {
      const context = {
        params: matchedRoute.params,
        query: matchedRoute.query,
        url: url,
      };

      const result = await matchedRoute.generateMetaData(context);

      return result;
    } catch (error) {
      console.error("Prefetch error:", error);
      return null;
    }
  }

  /**
   * 쿼리 파라미터를 객체로 파싱
   * @param search "?a=1&b=2" 형태 문자열 또는 ""
   */
  static parseQuery(search: string = ""): Record<string, string> {
    const params = new URLSearchParams(search.startsWith("?") ? search : search ? `?${search}` : "");
    const query: Record<string, string> = {};
    for (const [key, value] of params) {
      if (value !== "" && value != null) {
        query[key] = value;
      }
    }
    return query;
  }
}
