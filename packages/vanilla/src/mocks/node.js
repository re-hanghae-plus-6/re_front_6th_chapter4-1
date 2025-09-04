import { setupServer } from "msw/node";
import { handlers } from "./handlers.js";

// Node 환경용 서버 MSW
export const server = setupServer(...handlers);
