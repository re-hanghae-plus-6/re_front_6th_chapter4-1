import { Router, ServerRouter } from "../lib"; // ServerRouter import 추가
import { BASE_URL } from "../constants.js";

// 클라이언트(브라우저) 환경과 서버 환경에 따라 다른 라우터 인스턴스 사용
export const router =
  typeof window !== "undefined" // window 객체 존재 여부로 환경 판단
    ? new Router(BASE_URL) // 클라이언트 환경: 일반 Router 사용
    : new ServerRouter(""); // 서버 환경: ServerRouter 사용 (기본 URL은 서버에서 처리)
