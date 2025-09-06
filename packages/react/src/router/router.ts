import { SPARouter, ServerRouter, isServer } from "@hanghae-plus/lib";
import type { FunctionComponent } from "react";

import { BASE_URL } from "../constants";

function createRouter() {
  const RouterClass = isServer() ? ServerRouter : SPARouter;
  return new RouterClass<FunctionComponent>({}, BASE_URL);
}

export const router = createRouter();
