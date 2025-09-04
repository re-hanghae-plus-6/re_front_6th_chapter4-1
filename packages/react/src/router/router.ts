// 글로벌 라우터 인스턴스 - SSR 환경 체크
import { Router } from "@hanghae-plus/lib";
import { BASE_URL } from "../constants";
import { isServer } from "../utils/runtime";
import type { FunctionComponent } from "react";

// 더미 라우터 객체 (서버 환경용)
const createDummyRouter = () => ({
  addRoute: () => {},
  start: () => {},
  push: (url: string) => {
    // 서버에서는 실제 navigation 하지 않음
    console.log("Server-side router push called:", url);
  },
  replace: (url: string) => {
    // 서버에서는 실제 navigation 하지 않음
    console.log("Server-side router replace called:", url);
  },
  subscribe: () => () => {},
  get query() {
    return {};
  },
  get params() {
    return {};
  },
  get route() {
    return null;
  },
  get target() {
    return null;
  },
});

// 안전한 라우터 초기화 - 런타임에 결정
let _router: Router<FunctionComponent> | null = null;

const getRouter = () => {
  if (!_router) {
    if (isServer) {
      _router = createDummyRouter() as Router<FunctionComponent>;
    } else {
      _router = new Router<FunctionComponent>(BASE_URL);
    }
  }
  return _router;
};

// 라우터 인스턴스 export
export const router = getRouter();
