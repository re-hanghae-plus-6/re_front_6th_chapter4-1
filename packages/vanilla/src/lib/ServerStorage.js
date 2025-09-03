class ServerStorage {
  constructor() {
    this.data = new Map();
  }

  get(key) {
    return this.data.get(key) || null;
  }

  set(key, value) {
    this.data.set(key, value);
  }

  reset(key) {
    this.data.delete(key);
  }
}

export const serverStorage = new ServerStorage();
