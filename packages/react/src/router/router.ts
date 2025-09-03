// 글로벌 라우터 인스턴스
import { Router, ServerRouter } from "@hanghae-plus/lib";
import { BASE_URL } from "../constants";
import type { FunctionComponent } from "react";

export const router =
  typeof window !== "undefined"
    ? new Router<FunctionComponent>(BASE_URL)
    : new ServerRouter<FunctionComponent>(BASE_URL);
