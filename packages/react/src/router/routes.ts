/**
 * 라우트 설정 - 클라이언트와 서버에서 공통으로 사용
 * 바닐라 JavaScript의 routes.js를 React/TypeScript로 포팅
 */
import { HomePage, NotFoundPage, ProductDetailPage } from "../pages";
import {
  homePageSSR,
  homePageMetadata,
  productDetailPageSSR,
  productDetailPageMetadata,
  notFoundPageSSR,
  notFoundPageMetadata,
} from "../pages/ssr-methods";
import type { RouteConfig, SSRPageComponent } from "../types/ssr";
import type { Router } from "@hanghae-plus/lib";
import type { ServerRouter } from "./ServerRouter";

/**
 * 라우트 매칭 순서 (구체적인 것부터 일반적인 것 순서로)
 * 바닐라와 동일한 라우트 구조 유지
 */
export const routeMatches: RouteConfig[] = [
  {
    path: "/",
    component: HomePage as SSRPageComponent,
    name: "HomePage",
  },
  {
    path: "/product/:id/",
    component: ProductDetailPage as SSRPageComponent,
    name: "ProductDetailPage",
  },
  {
    path: "*",
    component: NotFoundPage as SSRPageComponent,
    name: "NotFoundPage",
  },
];

/**
 * 라우트 설정을 기반으로 클라이언트 라우터에 라우트 등록
 * @param router - Router 인스턴스 (@hanghae-plus/lib)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function registerClientRoutes(router: Router<any>): void {
  routeMatches.forEach(({ path, component }) => {
    router.addRoute(path, component);
  });
}

/**
 * 서버 라우트 설정 - SSR 메서드만 포함 (클라이언트 컴포넌트 import 방지)
 */
export const serverRouteMatches = [
  {
    path: "/",
    ssr: homePageSSR,
    metadata: homePageMetadata,
    name: "HomePage",
  },
  {
    path: "/product/:id/",
    ssr: productDetailPageSSR,
    metadata: productDetailPageMetadata,
    name: "ProductDetailPage",
  },
  {
    path: "*",
    ssr: notFoundPageSSR,
    metadata: notFoundPageMetadata,
    name: "NotFoundPage",
  },
];

/**
 * 라우트 설정을 기반으로 서버 라우터에 라우트 등록
 * @param serverRouter - ServerRouter 인스턴스
 */
export function registerServerRoutes(serverRouter: ServerRouter): void {
  serverRouteMatches.forEach(({ path, ssr, metadata }) => {
    // 서버에서는 SSR 메서드만 등록
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const serverComponent = { ssr, metadata } as any;
    serverRouter.addRoute(path, serverComponent);
  });
}
