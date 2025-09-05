// 글로벌 라우터 인스턴스
import { Router } from "@hanghae-plus/lib";
import type { FunctionComponent } from "react";
import { BASE_URL } from "../constants";
import { isServer } from "../utils/envUtils";
import { ServerRouter } from "./ServerRouter";

// ! 실제로 서버환경에서 Router가 사용되지 않도록 방지 코드
export const router = isServer ? new ServerRouter() : new Router<FunctionComponent>(BASE_URL);
