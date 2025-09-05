import { setupServer } from "msw/node";
import { handlers } from "./handlers.js";

// MSW 서버 설정 (node용)
export const mockServer = setupServer(...handlers);
