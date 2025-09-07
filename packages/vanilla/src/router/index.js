// 글로벌 라우터 인스턴스
import { withLifecycle } from "./withLifecycle.js";
import { BASE_URL } from "../constants.js";
import { ClientRouter } from "./ClientRouter.js";
import { ServerRouter } from "./ServerRouter.js";

// 환경에 따라 클라이언트와 서버 라우터 선택
const CurrentRouter = typeof window !== "undefined" ? ClientRouter : ServerRouter;

export const router = new CurrentRouter(BASE_URL);
export { withLifecycle };
