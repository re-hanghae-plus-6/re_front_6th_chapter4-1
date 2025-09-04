import { router } from "./router";
import { HomePage } from "./pages/HomePage.js";
import { ProductDetailPage } from "./pages/ProductDetailPage.js";
import { NotFoundPage } from "./pages/NotFoundPage.js";

// 라우터 설정 - 서버와 클라이언트에서 공통으로 사용
export const setupRouter = () => {
  router.addRoute("/", HomePage);
  router.addRoute("/product/:id/", ProductDetailPage);
  router.addRoute(".*", NotFoundPage);
};