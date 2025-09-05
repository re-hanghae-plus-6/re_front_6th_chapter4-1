// 환경 구분 상수
export const isClient = typeof window !== "undefined";

export const isServer = !isClient;

// 애플리케이션 기본 설정
export const BASE_URL = import.meta.env.PROD ? "/front_6th_chapter4-1/vanilla/" : "/";
