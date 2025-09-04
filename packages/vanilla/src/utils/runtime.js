/**
 * 런타임 환경 유틸리티
 */

// 서버 환경인지 확인
export const isServer = typeof window === "undefined";

// 클라이언트 환경인지 확인
export const isClient = typeof window !== "undefined";

// Node.js 환경인지 확인
export const isNode = typeof process !== "undefined" && process.versions && process.versions.node;

// 브라우저 환경인지 확인
export const isBrowser = typeof window !== "undefined" && typeof document !== "undefined";
