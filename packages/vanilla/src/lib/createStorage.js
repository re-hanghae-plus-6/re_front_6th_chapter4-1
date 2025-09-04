const createMemoryStorage = () => {
  let value = {};

  const getItem = (key) => (key in value ? String(value[key]) : null);
  const setItem = (key, newValue) => {
    value[key] = String(newValue);
  };
  const removeItem = (key) => {
    delete value[key];
  };
  const clear = () => {
    value = {};
  };

  return {
    getItem,
    setItem,
    removeItem,
    clear,
    get: getItem,
    set: setItem,
    remove: removeItem,
  };
};

/**
 * 로컬스토리지 추상화 함수
 * @param {string} key - 스토리지 키
 * @param {Storage} storage - 기본값은 localStorage
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
