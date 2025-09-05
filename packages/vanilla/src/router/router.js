import { Router } from "../lib/index.js";
import { BASE_URL } from "../constants.js";
import { serverRouter } from "./ServerRoute.js";

export const router =
  typeof window !== "undefined"
    ? new Router(BASE_URL) // 클라이언트 -> Router 클래스 인스턴스 생성
    : serverRouter; // 서버 ->  이미 생성된 serverRouter 인스턴스 사용
