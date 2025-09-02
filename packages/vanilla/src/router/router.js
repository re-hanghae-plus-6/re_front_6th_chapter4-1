// 글로벌 라우터 인스턴스
import { BASE_URL } from "../constants.js";
import { isServer } from "../utils/server.js";
import { Router } from "../lib/Router.js";
import { ServerRouter } from "../lib/ServerRouter.js";

export const router = isServer() ? new ServerRouter(BASE_URL) : new Router(BASE_URL);
