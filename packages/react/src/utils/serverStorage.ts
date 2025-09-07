/**
 * 서버 환경에서 사용할 mock localStorage 객체
 */
export const serverStorage = {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {},
  clear: () => {},
  length: 0,
  key: () => null,
};

/**
 * 환경에 따른 storage 객체 반환
 * 서버에서는 mock 객체, 클라이언트에서는 실제 localStorage 사용
 */
export const getStorage = () => {
  return typeof window !== "undefined" ? window.localStorage : serverStorage;
};
