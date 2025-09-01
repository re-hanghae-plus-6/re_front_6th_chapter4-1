import { BASE_URL } from "../constants";
import { Router, ServerRouter } from "../lib";

/** 글로벌 라우터 인스턴스 */
export const router = typeof window === "undefined" ? new ServerRouter(BASE_URL) : new Router(BASE_URL);
