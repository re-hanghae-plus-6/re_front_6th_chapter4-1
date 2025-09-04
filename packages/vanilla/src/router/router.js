// 글로벌 라우터 인스턴스
import { Router } from "../lib";
import { BASE_URL } from "../constants.js";

const isBrowser = typeof window !== "undefined";

export const router = isBrowser
  ? new Router(BASE_URL)
  : {
      query: {},
      params: {},
      start() {},
      navigate() {},
      push() {},
      back() {},
      replace() {},
    };
