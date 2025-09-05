/**
 * SSR 환경 체크 및 브라우저 전용 함수 래퍼
 */

export const isServer = typeof window === "undefined";
export const isBrowser = !isServer;

/**
 * 브라우저에서만 실행되는 함수 래퍼
 */
export const clientOnly = (fn, fallback = () => {}) => {
  return (...args) => {
    if (isBrowser) {
      return fn(...args);
    }
    return fallback(...args);
  };
};

/**
 * 서버에서만 실행되는 함수 래퍼
 */
export const serverOnly = (fn, fallback = () => {}) => {
  return (...args) => {
    if (isServer) {
      return fn(...args);
    }
    return fallback(...args);
  };
};

/**
 * 안전한 localStorage 래퍼
 */
export const safeLocalStorage = {
  getItem: clientOnly(
    (key) => window.localStorage.getItem(key),
    () => null,
  ),
  setItem: clientOnly(
    (key, value) => window.localStorage.setItem(key, value),
    () => {},
  ),
  removeItem: clientOnly(
    (key) => window.localStorage.removeItem(key),
    () => {},
  ),
};

/**
 * 안전한 DOM 접근 래퍼
 */
export const safeDocument = {
  getElementById: clientOnly(
    (id) => document.getElementById(id),
    () => null,
  ),
  querySelector: clientOnly(
    (selector) => document.querySelector(selector),
    () => null,
  ),
  addEventListener: clientOnly(
    (event, handler) => document.addEventListener(event, handler),
    () => {},
  ),
};
