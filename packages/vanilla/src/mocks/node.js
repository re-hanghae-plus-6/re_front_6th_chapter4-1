import { setupServer } from "msw/node";

import { handlers } from "./handlers.js";

// MSW 서버 설정
export const mswServer = setupServer(...handlers);
