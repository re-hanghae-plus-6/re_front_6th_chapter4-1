import { BASE_URL } from "../constants";
import { SPARouter, ServerRouter } from "../lib";
import { isServer } from "../utils";

/** 글로벌 라우터 인스턴스 */
export const routerInstance = isServer() ? new ServerRouter() : new SPARouter(BASE_URL);
