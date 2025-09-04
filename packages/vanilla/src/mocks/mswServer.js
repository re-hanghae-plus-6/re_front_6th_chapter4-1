// jest.setup.js
import { setupServer } from "msw/node";
import { handlers } from "./handlers.js";

const mswServer = setupServer(...handlers);

export { mswServer };
