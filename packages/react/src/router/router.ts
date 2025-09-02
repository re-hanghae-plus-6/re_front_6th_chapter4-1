// 글로벌 라우터 인스턴스
import { Router } from "@hanghae-plus/lib";
import { BASE_URL } from "../constants.js";
import type { FunctionComponent } from "react";

export const router = new Router<FunctionComponent>(BASE_URL);
