import { setupServer } from "msw/node";
import { handlers } from "./handlers.js";

// 서버전용 MSW 워커 설정
export const server = setupServer(...handlers);
