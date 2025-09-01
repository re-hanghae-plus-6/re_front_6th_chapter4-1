// 메모리 스토리지
const createMemoryStorage = () => {
  const storage = new Map();

  return {
    getItem: (key) => storage.get(key) || null,
    setItem: (key, value) => storage.set(key, value),
    removeItem: (key) => storage.delete(key),
  };
};

// 환경에 따른 스토리지 선택
const getDefaultStorage = () => {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  return createMemoryStorage();
};

/**
 * 로컬스토리지 추상화 함수
 * @param {string} key - 스토리지 키
 * @param {Storage} storage - 기본값은 localStorage (브라우저) 또는 메모리스토리지 (서버)
 * @returns {Object} { get, set, reset }
 */
export const createStorage = (key, storage = getDefaultStorage()) => {
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
