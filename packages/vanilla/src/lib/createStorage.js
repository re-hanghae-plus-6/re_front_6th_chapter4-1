const createMemoryStorage = () => {
  let value = {};

  return {
    getItem: (key) => (key in value ? value[key] : null),
    setItem: (key, value) => {
      value[key] = value;
    },
    removeItem: (key) => {
      delete value[key];
    },
    clear: () => {
      value = {};
    },
  };
};

const memoryStorage = createMemoryStorage();

/**
 * 로컬스토리지 추상화 함수
 * @param {string} key - 스토리지 키
 * @param {Storage} storage - 기본값은 localStorage
 * @returns {Object} { get, set, reset }
 */
export const createStorage = (key, storage = typeof window === "undefined" ? memoryStorage : window.localStorage) => {
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
