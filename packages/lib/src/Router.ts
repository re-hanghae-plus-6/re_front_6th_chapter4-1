// packages/lib/src/Router.ts
import { BaseRouter } from "./BaseRouter";
import type { AnyFunction, StringRecord } from "./types";

type QueryPayload = Record<string, string | number | undefined>;

export class Router<Handler extends AnyFunction> extends BaseRouter<Handler> {
  constructor(baseUrl = "") {
    super(baseUrl);

    // 클라이언트 전용 이벤트 리스너
    if (typeof window !== "undefined") {
      window.addEventListener("popstate", () => {
        this.updateRoute(this.getCurrentUrl());
      });

      document.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (!target?.closest("[data-link]")) {
          return;
        }
        e.preventDefault();
        const url = target.getAttribute("href") ?? target.closest("[data-link]")?.getAttribute("href");
        if (url) {
          this.push(url);
        }
      });
    }
  }

  get query(): StringRecord {
    if (typeof window === "undefined") {
      return {};
    }
    return BaseRouter.parseQuery(window.location.search);
  }

  set query(newQuery: QueryPayload) {
    const newUrl = BaseRouter.getUrl(newQuery, this.baseUrl, window.location.pathname, window.location.search);
    this.push(newUrl);
  }

  getCurrentUrl(): string {
    if (typeof window === "undefined") {
      return "/";
    }
    return `${window.location.pathname}${window.location.search}`;
  }

  getOrigin(): string {
    if (typeof window === "undefined") {
      return "http://localhost";
    }
    return window.location.origin;
  }

  push(url: string) {
    try {
      const fullUrl = url.startsWith(this.baseUrl) ? url : this.baseUrl + (url.startsWith("/") ? url : "/" + url);
      const prevFullUrl = `${window.location.pathname}${window.location.search}`;

      if (prevFullUrl !== fullUrl) {
        window.history.pushState(null, "", fullUrl);
      }

      this.updateRoute(fullUrl);
    } catch (error) {
      console.error("라우터 네비게이션 오류:", error);
    }
  }

  start() {
    this.updateRoute(this.getCurrentUrl());
  }
}
