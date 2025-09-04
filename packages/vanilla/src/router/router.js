// 글로벌 라우터 인스턴스
import { Router } from "../lib";
import { BASE_URL } from "../constants.js";
import { HomePage } from "../pages/HomePage.js";
import { ProductDetailPage } from "../pages/ProductDetailPage.js";
import { NotFoundPage } from "../pages/NotFoundPage.js";

export const router = new Router(BASE_URL);

router.addRoute("/", HomePage);
router.addRoute("/product/:id/", ProductDetailPage);
router.addRoute(".*", NotFoundPage);
