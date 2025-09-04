// 글로벌 라우터 인스턴스
import { Router, ServerRouter } from "../lib/index.js";
import { BASE_URL } from "../constants.js";
import { isServer } from "../utils/isServer.js";

export const router = !isServer() ? new Router(BASE_URL) : new ServerRouter();
