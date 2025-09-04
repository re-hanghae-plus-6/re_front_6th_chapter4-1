declare global {
  interface Window {
    __INITIAL_DATA__: unknown;
  }
}

export function getInitialData<T = unknown>(): T | null {
  if (typeof window !== "undefined" && window.__INITIAL_DATA__) {
    const data = window.__INITIAL_DATA__;
    // 사용 후 삭제하여 메모리 누수 방지
    delete window.__INITIAL_DATA__;
    return data as T;
  }
  return null;
}
