import { App } from "./App";
import { router } from "./router";
import { BASE_URL } from "./constants.ts";
import { createRoot, hydrateRoot } from "react-dom/client";
import { hydrateWithServerData } from "./services/hydration";

const enableMocking = () =>
  import("./mocks/browser").then(({ worker }) =>
    worker.start({
      serviceWorker: {
        url: `${BASE_URL}mockServiceWorker.js`,
      },
      onUnhandledRequest: "bypass",
    }),
  );

function main() {
  // 서버 데이터로 스토어 하이드레이션 (라우터 시작 전에)
  hydrateWithServerData();

  router.start();

  const rootElement = document.getElementById("root")!;

  // 서버에서 렌더링된 HTML이 있으면 하이드레이션, 없으면 일반 렌더링
  if (rootElement.innerHTML.trim()) {
    // 하이드레이션: 서버 렌더링된 HTML에 이벤트 리스너 등을 연결
    hydrateRoot(rootElement, <App />);
  } else {
    // 일반 렌더링: 클라이언트에서 처음부터 렌더링
    createRoot(rootElement).render(<App />);
  }
}

// 애플리케이션 시작
enableMocking().then(main);
