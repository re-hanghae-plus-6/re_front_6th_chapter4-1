import { HomePage, ProductDetailPage, NotFoundPage } from "../pages";

export const routes = {
  "/": HomePage,
  "/product/:id/": ProductDetailPage,
  "*": NotFoundPage,
};
