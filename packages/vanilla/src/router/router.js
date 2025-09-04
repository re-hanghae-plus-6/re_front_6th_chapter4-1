// 글로벌 라우터 인스턴스
import { BASE_URL } from "../constants.js";
import { Router, ServerRouter } from "../lib";

// 환경에 따라 클라이언트와 서버 라우터 선택
const CurrentRouter = typeof window !== "undefined" ? Router : ServerRouter;

export const router = new CurrentRouter(BASE_URL);
