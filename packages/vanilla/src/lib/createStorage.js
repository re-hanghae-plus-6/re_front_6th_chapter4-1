/**
 * 메모리 기반 스토리지 구현체 (서버 사이드용)
 */
const createMemoryStorage = () => {
  const store = new Map();

  return {
    getItem: (key) => store.get(key) || null,
    setItem: (key, value) => store.set(key, value),
    removeItem: (key) => store.delete(key),
    clear: () => store.clear(),
    get length() {
      return store.size;
    },
    key: (index) => Array.from(store.keys())[index] || null,
  };
};

/**
 * 로컬스토리지 추상화 함수
 * @param {string} key - 스토리지 키
 * @param {Storage} storage - 기본값은 localStorage (서버에서는 메모리 스토리지)
 * @returns {Object} { get, set, reset }
 */
export const createStorage = (
  key,
  storage = typeof window !== "undefined" ? window.localStorage : createMemoryStorage(),
) => {
  const get = () => {
    try {
      const item = storage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error parsing storage item for key "${key}":`, error);
      return null;
    }
  };

  const set = (value) => {
    try {
      storage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Error setting storage item for key "${key}":`, error);
    }
  };

  const reset = () => {
    try {
      storage.removeItem(key);
    } catch (error) {
      console.error(`Error removing storage item for key "${key}":`, error);
    }
  };

  return { get, set, reset };
};
