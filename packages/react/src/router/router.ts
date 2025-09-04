import { BASE_URL } from "../constants";
import type { FunctionComponent } from "react";
import { HomePage, ProductDetailPage, NotFoundPage } from "../pages";
import { Router } from "@hanghae-plus/lib";
import { isClient } from "../utils";
import { ServerRouter } from "./ServerRouter";

export const routes = {
  "/": HomePage,
  "/product/:id/": ProductDetailPage,
  "*": NotFoundPage,
};

export const router = isClient() ? new Router<FunctionComponent>(BASE_URL) : new ServerRouter(routes);
