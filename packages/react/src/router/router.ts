import { Router, ServerRouter } from "@hanghae-plus/lib";
import { BASE_URL } from "../constants";
import type { FunctionComponent } from "react";

const CurrentRouter = typeof window !== "undefined" ? Router : ServerRouter;
export const router = new CurrentRouter<FunctionComponent>(BASE_URL);
