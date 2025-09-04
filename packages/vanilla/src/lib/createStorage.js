/**
 * 로컬스토리지 추상화 함수
 * @param {string} key - 스토리지 키
 * @param {Storage} storage - 기본값은 localStorage (브라우저 환경에서만)
 * @returns {Object} { get, set, reset }
 */
export const createStorage = (key, storage = typeof window !== "undefined" ? window.localStorage : null) => {
  const get = () => {
    if (!storage) return null; // 서버 환경에서는 null 반환
    try {
      const item = storage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error parsing storage item for key "${key}":`, error);
      return null;
    }
  };

  const set = (value) => {
    if (!storage) return; // 서버 환경에서는 아무것도 하지 않음
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting storage item for key "${key}":`, error);
    }
  };

  const reset = () => {
    if (!storage) return; // 서버 환경에서는 아무것도 하지 않음
    try {
      storage.removeItem(key);
    } catch (error) {
      console.error(`Error removing storage item for key "${key}":`, error);
    }
  };

  return { get, set, reset };
};
