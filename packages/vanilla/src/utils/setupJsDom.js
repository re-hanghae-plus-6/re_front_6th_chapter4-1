// server-jsdom-setup.js

import { JSDOM } from "jsdom";

export async function setupServerJsdom() {
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
      url: `http://localhost:5173`,
      referrer: `http://localhost:5173`,
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

  // 기타 유용한 APIs
  globalThis.XMLHttpRequest = dom.window.XMLHttpRequest;

  // Node.js의 내장 fetch 사용 (Node.js 18+)
  if (typeof globalThis.fetch === "undefined") {
    // Node.js 18+ 에서는 fetch가 전역으로 사용 가능
    if (typeof fetch !== "undefined") {
      globalThis.fetch = fetch;
    } else {
      console.warn("Node.js fetch not available, using jsdom fetch");
      globalThis.fetch = dom.window.fetch;
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
