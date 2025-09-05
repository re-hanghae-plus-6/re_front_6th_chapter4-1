/**
 * 로컬스토리지 추상화 함수
 * @param {string} key - 스토리지 키
 * @param {Storage} storage - 기본값은 localStorage
 * @returns {Object} { get, set, reset }
 */
export const createStorage = (key, storage) => {
  // 인자로 받는 storage가 기존에는 window.localStorage이었음
  // 서버 실행이면 null, 클라이언트 실행이면 window.localStorage

  const defaultStorage = typeof window !== "undefined" ? window.localStorage : null;
  const actualStorage = storage || defaultStorage;

  const get = () => {
    try {
      if (!actualStorage) return null;

      const item = actualStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error parsing storage item for key "${key}":`, error);
      return null;
    }
  };

  const set = (value) => {
    try {
      if (!actualStorage) return;
      actualStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting storage item for key "${key}":`, error);
    }
  };

  const reset = () => {
    try {
      if (!actualStorage) return;
      actualStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing storage item for key "${key}":`, error);
    }
  };

  return { get, set, reset };
};
