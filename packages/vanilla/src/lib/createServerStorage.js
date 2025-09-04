/**
 * 서버 환경용 메모리 스토리지 - localStorage API와 동일한 인터페이스 제공
 * @returns {Object} localStorage와 호환되는 메서드를 가진 객체
 */
export const createServerStorage = () => {
  const storage = new Map();

  return {
    getItem: (key) => storage.get(key),
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
    clear: () => storage.clear(),
  };
};
