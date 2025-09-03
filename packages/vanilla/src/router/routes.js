/**
 * 라우트 설정 - 클라이언트와 서버에서 공통으로 사용
 */
import { HomePage, NotFoundPage, ProductDetailPage } from "../pages";

/**
 * 라우트 매칭 순서 (구체적인 것부터 일반적인 것 순서로)
 */
export const routeMatches = [
  {
    path: "/",
    component: HomePage,
    name: "HomePage",
  },
  {
    path: "/product/:id/",
    component: ProductDetailPage,
    name: "ProductDetailPage",
  },
  {
    path: ".*",
    component: NotFoundPage,
    name: "NotFoundPage",
  },
];

/**
 * 라우트 설정을 기반으로 라우터에 라우트 등록
 * @param {Object} router - Router 또는 ServerRouter 인스턴스
 */
export function registerRoutes(router) {
  routeMatches.forEach(({ path, component }) => {
    router.addRoute(path, component);
  });
}
