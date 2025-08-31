// server-jsdom-setup.js

import { JSDOM } from "jsdom";

export function setupServerJsdom() {
  // 이미 설정되어 있다면 스킵
  if (typeof globalThis.window !== "undefined") {
    return;
  }

  console.log("🔧 Setting up jsdom environment for SSR...");

  // JSDOM 인스턴스 생성
  const dom = new JSDOM(
    `
    <!DOCTYPE html>
    <html>
      <head><title>SSR</title></head>
      <body><div id="root"></div></body>
    </html>
  `,
    {
      url: "http://localhost:5173",
      referrer: "http://localhost:5173",
      contentType: "text/html",
      includeNodeLocations: true,
      storageQuota: 10000000,
      pretendToBeVisual: false, // 성능 최적화
      resources: "usable",
    },
  );

  // 전역 객체들을 jsdom으로 설정
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;

  // Storage APIs
  globalThis.localStorage = dom.window.localStorage;
  globalThis.sessionStorage = dom.window.sessionStorage;

  // DOM APIs
  globalThis.Element = dom.window.Element;
  globalThis.HTMLElement = dom.window.HTMLElement;
  globalThis.Node = dom.window.Node;
  globalThis.DocumentFragment = dom.window.DocumentFragment;

  // Event APIs
  globalThis.Event = dom.window.Event;
  globalThis.CustomEvent = dom.window.CustomEvent;
  globalThis.MouseEvent = dom.window.MouseEvent;
  globalThis.KeyboardEvent = dom.window.KeyboardEvent;

  // Timer functions는 Node.js 기본 함수 사용 (재할당하지 않음)
  // globalThis.setTimeout = dom.window.setTimeout; // 제거
  // globalThis.clearTimeout = dom.window.clearTimeout; // 제거
  // globalThis.setInterval = dom.window.setInterval; // 제거
  // globalThis.clearInterval = dom.window.clearInterval; // 제거

  // 기타 유용한 APIs
  globalThis.XMLHttpRequest = dom.window.XMLHttpRequest;
  globalThis.fetch = dom.window.fetch; // jsdom이 지원하는 경우

  // fetch API 설정 (Node.js 18+ 또는 node-fetch 사용)
  if (!globalThis.fetch) {
    try {
      // Node.js 18+에서는 fetch가 기본 제공됨
      globalThis.fetch = globalThis.fetch || require("node-fetch");
    } catch {
      console.warn("fetch API not available, using mock fetch");
      globalThis.fetch = async () => {
        // Mock fetch for development
        return {
          ok: true,
          json: async () => ({ products: [], categories: [] }),
          text: async () => "{}",
        };
      };
    }
  }

  console.log("✅ jsdom environment ready");
}

// 정리 함수 (필요시)
export function cleanupJsdom() {
  if (globalThis.window && globalThis.window.close) {
    globalThis.window.close();
  }
}
