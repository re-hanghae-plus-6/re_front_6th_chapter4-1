// router.tsx
import { Router } from "@hanghae-plus/lib";
import { BASE_URL } from "../constants.js";
import type { FunctionComponent } from "react";

const createRouter = () => {
  if (typeof window === "undefined") {
    // 서버: MemoryRouter
    return new Router<FunctionComponent>("");
  } else {
    // 클라이언트: BrowserRouter
    return new Router<FunctionComponent>(BASE_URL);
  }
};

export const router = createRouter();

// App.tsx
// router.addRoute("/", HomePage);
// router.addRoute("/product/:id/", ProductDetailPage);
// router.addRoute("*", NotFoundPage);
