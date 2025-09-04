export const createSafeStorage = (key, type = "local") => {
  const memory = {};
  let useMemory = false;

  if (typeof window === "undefined") {
    useMemory = true;
  } else {
    const storage = type === "local" ? localStorage : sessionStorage;
    try {
      storage.setItem("__test", "");
      storage.removeItem("__test");
    } catch {
      useMemory = true;
    }
  }

  const get = () => {
    try {
      let item;
      if (useMemory) {
        item = memory[key];
      } else {
        const storage = type === "local" ? localStorage : sessionStorage;
        item = storage.getItem(key);
      }
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error(`Error parsing storage item for key "${key}":`, error);
      return null;
    }
  };

  const set = (value) => {
    try {
      const stringValue = JSON.stringify(value);
      if (useMemory) {
        memory[key] = stringValue;
      } else {
        const storage = type === "local" ? localStorage : sessionStorage;
        storage.setItem(key, stringValue);
      }
    } catch (error) {
      console.error(`Error setting storage item for key "${key}":`, error);
    }
  };

  const reset = () => {
    try {
      if (useMemory) {
        delete memory[key];
      } else {
        const storage = type === "local" ? localStorage : sessionStorage;
        storage.removeItem(key);
      }
    } catch (error) {
      console.error(`Error removing storage item for key "${key}":`, error);
    }
  };

  return { get, set, reset };
};
