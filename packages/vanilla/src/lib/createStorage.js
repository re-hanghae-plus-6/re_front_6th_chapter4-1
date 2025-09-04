import { createServerStorage } from "./createServerStorage.js";
/**
 * 환경별 스토리지 추상화 함수 - 브라우저/서버 환경에서 동일한 인터페이스 제공
 * @param {string} key - 스토리지 키 (예: "cart", "user-preferences")
 * @param {Storage} storage - 스토리지 구현체 (기본값: 환경별 자동 선택)
 * @returns {Object} { get, set, reset } 스토리지 조작 메서드들
 */
export const createStorage = (
  key,
  storage = typeof window === "undefined" ? createServerStorage() : window.localStorage,
) => {
  // 데이터 조회
  const get = () => {
    try {
      const item = storage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error parsing storage item for key "${key}":`, error);
      return null;
    }
  };

  // 데이터 저장
  const set = (value) => {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting storage item for key "${key}":`, error);
    }
  };

  // 데이터 삭제
  const reset = () => {
    try {
      storage.removeItem(key);
    } catch (error) {
      console.error(`Error removing storage item for key "${key}":`, error);
    }
  };

  return { get, set, reset };
};
