// 글로벌 라우터 인스턴스
import { BASE_URL } from "../constants";
import { isServer } from "../utils";
import { Router, ServerRouter } from "../lib";

export const router = isServer() ? new ServerRouter(BASE_URL) : new Router(BASE_URL);
