// 글로벌 라우터 인스턴스
import { Router } from "../lib";
import { BASE_URL } from "../constants.js";
import { ServerRouter } from "../lib/ServerRouter.js";
import { isServer } from "../utils/isServer.js";

export const router = isServer ? new ServerRouter({}) : new Router(BASE_URL);
