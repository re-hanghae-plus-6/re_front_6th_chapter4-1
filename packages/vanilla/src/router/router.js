// 글로벌 라우터 인스턴스
import { GlobalRouter } from "../lib";
import { BASE_URL } from "../constants.js";

export const router = new GlobalRouter(BASE_URL);
