class ServerStorage {
  data: Map<string, unknown>;

  constructor() {
    this.data = new Map();
  }

  getItem(key: string) {
    return this.data.get(key) || null;
  }

  setItem(key: string, value: unknown) {
    this.data.set(key, value);
  }

  removeItem(key: string) {
    this.data.delete(key);
  }

  reset(key: string) {
    this.data.delete(key);
  }
}

export const serverStorage = new ServerStorage();
