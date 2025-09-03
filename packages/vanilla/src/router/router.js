// 글로벌 라우터 인스턴스
import { BASE_URL } from "../constants.js";
import { ClientRouter } from "../lib";
import { serverRouter } from "../lib/ServerRouter.js";

import { isServer } from "../utils/envUtils.js";

export const router = isServer ? serverRouter : new ClientRouter(BASE_URL);
