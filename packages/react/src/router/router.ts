// 글로벌 라우터 인스턴스
import { Router, MemoryRouter } from "@hanghae-plus/lib";
import { BASE_URL } from "../constants";
import type { FunctionComponent } from "react";

// export const router = new Router<FunctionComponent>(BASE_URL);

let router: Router<FunctionComponent> | MemoryRouter<FunctionComponent>;

if (typeof window === "undefined") {
  // Node.js (SSR 환경)
  router = new MemoryRouter<FunctionComponent>();
} else {
  // Browser (CSR 환경)
  router = new Router<FunctionComponent>(BASE_URL);
}

export { router };
