// 글로벌 라우터 인스턴스
import { Router } from "@hanghae-plus/lib";
import type { FC } from "react";
import { BASE_URL } from "../constants";
import { HomePage, NotFoundPage, ProductDetailPage } from "../pages";

export const router = new Router<FC<unknown>>(BASE_URL);

const routes = {
  "/": HomePage,
  "/product/:id/": ProductDetailPage,
  ".*": NotFoundPage,
};

Object.entries(routes).forEach(([path, page]) => {
  router.addRoute(path, page);
});
