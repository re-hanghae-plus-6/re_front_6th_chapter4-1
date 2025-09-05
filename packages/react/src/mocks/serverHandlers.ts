import { setupServer } from "msw/node";
import { handlers } from "./handlers.js";

// 기존 handlers.js를 서버용으로 감싸기
export const mswServer = setupServer(...handlers);
