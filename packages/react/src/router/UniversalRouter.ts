import { Router } from "./router";
import { ServerRouter } from "./ServerRouter";
import type { RouteHandler, MatchedRoute, ServerMatchedRoute, GetServerSideProps } from "./types";

/**
 * 유니버설 라우터 (지연평가)
 * - 서버: ServerRouter 사용
 * - 클라이언트: Router 사용
 * - 최초 사용 시점에 실제 라우터 인스턴스를 생성
 */
export class UniversalRouter {
  #instance: Router | ServerRouter | null;
  #baseUrl: string;

  constructor(baseUrl: string = "") {
    this.#instance = null;
    this.#baseUrl = String(baseUrl).replace(/\/$/, "");
  }

  #isServer(): boolean {
    try {
      // import.meta.env는 Vite SSR에서 주입됨
      // window 부재는 Node(서버) 환경 지표

      return typeof window === "undefined" || (!!import.meta?.env && !!import.meta.env.SSR);
    } catch {
      return true;
    }
  }

  #ensure(): Router | ServerRouter {
    if (this.#instance) return this.#instance;
    this.#instance = this.#isServer() ? new ServerRouter(this.#baseUrl) : new Router(this.#baseUrl);
    return this.#instance;
  }

  get baseUrl(): string {
    return this.#baseUrl;
  }

  get route(): MatchedRoute | ServerMatchedRoute | null {
    return this.#ensure().route ?? null;
  }

  get params(): Record<string, string> {
    return this.#ensure().params ?? {};
  }

  get target(): RouteHandler | undefined {
    return this.#ensure().target;
  }

  get query(): Record<string, string> {
    return this.#ensure().query ?? {};
  }

  set query(newQuery: Record<string, string | null | undefined>) {
    const inst = this.#ensure();
    try {
      // 클라이언트 Router는 setter가 있으며, 서버는 존재하지 않음 → 서버에서는 조용히 무시
      (inst as unknown as Router).query = newQuery;
    } catch {
      /* noop for server */
    }
  }

  addRoute(path: string, handler: RouteHandler, getServerSideProps?: GetServerSideProps): void {
    this.#ensure().addRoute(path, handler, getServerSideProps);
  }

  // 서버 전용 매칭(클라에서는 사용하지 않음)
  match(url: string): ServerMatchedRoute | null {
    const inst = this.#ensure();
    if (typeof (inst as unknown as ServerRouter).match === "function") return (inst as ServerRouter).match(url);
    throw new Error("UniversalRouter.match() is server-only");
  }

  // 서버 전용 resolve(클라에서는 사용하지 않음)
  createContext(url: string): ServerMatchedRoute | null {
    const inst = this.#ensure();
    if (typeof (inst as unknown as ServerRouter).createContext === "function")
      return (inst as ServerRouter).createContext(url);
    throw new Error("UniversalRouter.createContext() is server-only");
  }

  // 서버 전용 prefetch(클라에서는 사용하지 않음)
  async prefetch(url: string): Promise<Record<string, unknown> | null> {
    const inst = this.#ensure();
    if (typeof (inst as unknown as ServerRouter).prefetch === "function") return (inst as ServerRouter).prefetch(url);
    throw new Error("UniversalRouter.prefetch() is server-only");
  }

  // 클라이언트 내비게이션 (서버에서는 no-op)
  push(url: string): void {
    const inst = this.#ensure();
    if (typeof (inst as unknown as Router).push === "function") (inst as Router).push(url);
  }

  // 클라이언트 시작 (서버에서는 no-op)
  start(): void {
    const inst = this.#ensure();
    if (typeof (inst as unknown as Router).start === "function") (inst as Router).start();
  }

  // 클라이언트 구독 (서버에서는 no-op)
  subscribe(fn: () => void): () => void {
    const inst = this.#ensure();
    if (typeof (inst as unknown as Router).subscribe === "function") return (inst as Router).subscribe(fn);
    return () => {}; // 서버에서는 빈 unsubscribe 함수 반환
  }
}
