// 글로벌 라우터 인스턴스
import { Router } from "../lib";
import { BASE_URL } from "../constants.js";

const isBrowser = typeof window !== "undefined";

// 서버사이드에서 사용할 라우터 모킹 객체
const createServerRouter = () => {
  let currentQuery = {};

  return {
    get query() {
      return currentQuery;
    },
    params: {},
    start() {},
    navigate() {},
    push() {},
    back() {},
    replace() {},
    setQuery(query) {
      currentQuery = query || {};
    },
  };
};

export const router = isBrowser ? new Router(BASE_URL) : createServerRouter();
