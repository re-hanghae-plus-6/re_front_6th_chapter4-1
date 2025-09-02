// 글로벌 라우터 인스턴스 (SSR 안전 처리)
import { Router } from "../lib";
import { BASE_URL } from "../constants.js";

const isClient = typeof window !== "undefined" && typeof document !== "undefined";

export const router = isClient
  ? new Router(BASE_URL)
  : {
      // SSR에서 참조 시 window 에러 방지를 위해 기본값 배치
      query: {},
      params: {},
      route: null,
      target: null,
      baseUrl: "",
      subscribe() {},
      start() {},
      push() {},
    };
