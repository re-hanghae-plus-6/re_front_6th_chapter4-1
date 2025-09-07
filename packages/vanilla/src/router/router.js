// 글로벌 라우터 인스턴스
import { ClientRouter, ServerRouter } from "../lib";
import { BASE_URL } from "../constants.js";
import { HomePage } from "../pages/HomePage.js";
import { ProductDetailPage } from "../pages/ProductDetailPage.js";
import { NotFoundPage } from "../pages/NotFoundPage.js";

export const router = typeof window === "undefined" ? new ServerRouter(BASE_URL) : new ClientRouter(BASE_URL);

router.addRoute("/", HomePage);
router.addRoute("/product/:id/", ProductDetailPage);
router.addRoute(".*", NotFoundPage);
