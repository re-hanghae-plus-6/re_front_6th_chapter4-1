// 글로벌 라우터 인스턴스
import { Router } from "@hanghae-plus/lib";
import { BASE_URL } from "../constants";
import type { FunctionComponent } from "react";

const createRouter = () => ({
  push: () => {},
  addRoute: () => {},
  start: () => {},
  subscribe: () => () => {},
  get route() {
    return { path: "/" } as const;
  },
  get query() {
    return {} as const;
  },
});

export const router =
  typeof window !== "undefined"
    ? new Router<FunctionComponent>(BASE_URL)
    : (createRouter() as unknown as Router<FunctionComponent>);
