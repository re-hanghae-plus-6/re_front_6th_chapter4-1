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

export const createServerRouter = (url?: string) => {
  const router = new Router<FunctionComponent>(BASE_URL);
  // 서버에서는 초기 URL만 설정
  if (url) {
    router.push(url);
  }
  return router;
};
