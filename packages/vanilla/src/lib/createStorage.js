/**
 * 로컬스토리지 추상화 함수
 * @param {string} key - 스토리지 키
 * @param {Storage} storage - 기본값은 localStorage
 * @returns {Object} { get, set, reset }
 */
export const createStorage = (key, storage) => {
  // 서버(SSR)에서는 window가 없으므로 메모리 스토리지를 사용
  const memoryStorage = (() => {
    const map = new Map();
    return {
      getItem: (k) => (map.has(k) ? map.get(k) : null),
      setItem: (k, v) => map.set(k, v),
      removeItem: (k) => map.delete(k),
    };
  })();

  const storageImpl =
    storage ?? (typeof window !== "undefined" && window?.localStorage ? window.localStorage : memoryStorage);
  const get = () => {
    try {
      const item = storageImpl.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error parsing storage item for key "${key}":`, error);
      return null;
    }
  };

  const set = (value) => {
    try {
      storageImpl.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting storage item for key "${key}":`, error);
    }
  };

  const reset = () => {
    try {
      storageImpl.removeItem(key);
    } catch (error) {
      console.error(`Error removing storage item for key "${key}":`, error);
    }
  };

  return { get, set, reset };
};
