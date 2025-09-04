import { Router, ServerRouter } from "../lib";
import { BASE_URL } from "../constants.js";
import { isServer } from "../utils/runtime.js";

export const router = isServer
  ? new ServerRouter() // 서버에서는 인터페이스만 맞춤
  : new Router(BASE_URL); // 클라이언트에서는 라우터만 생성
