// 글로벌 라우터 인스턴스
import { BASE_URL } from "../constants.js";
import { Router, RouterSSR } from "../lib/index.js";

export const router = typeof window !== "undefined" ? new Router(BASE_URL) : new RouterSSR();
