// 글로벌 라우터 인스턴스
import { Router, ServerRouter } from "@hanghae-plus/lib";
import { BASE_URL } from "../constants";
import type { FunctionComponent } from "react";

const CurrentRoute = typeof window !== "undefined" ? Router : ServerRouter;
export const router = new CurrentRoute<FunctionComponent>(BASE_URL);
