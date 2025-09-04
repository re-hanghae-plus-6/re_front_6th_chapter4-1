import { Router } from "@hanghae-plus/lib";
import { BASE_URL } from "../constants";
import type { FunctionComponent } from "react";

export const createClientRouter = () => {
  const router = new Router<FunctionComponent>(BASE_URL);
  // 클라이언트에서만 이벤트 리스너 초기화
  if (typeof window !== "undefined") {
    router.start();
  }
  return router;
};

export const createServerRouter = () => {
  // 서버에서는 BASE_URL 없이 생성 (중복 방지)
  const router = new Router<FunctionComponent>("");
  return router;
};
