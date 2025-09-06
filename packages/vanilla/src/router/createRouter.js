import { isServer } from "../utils";
import { MemoryRouter, Router } from "../lib";
import { BASE_URL } from "../constants";
import { HomePage, NotFoundPage, ProductDetailPage } from "../pages";

export const createRouter = () => {
  const CurrentRouter = isServer() ? MemoryRouter : Router;

  const router = new CurrentRouter(BASE_URL);
  router.addRoute("/", HomePage);
  router.addRoute("/product/:id/", ProductDetailPage);
  router.addRoute(".*", NotFoundPage);

  return router;
};
