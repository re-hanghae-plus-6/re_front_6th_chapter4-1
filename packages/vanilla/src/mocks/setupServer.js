/**
 * 서버용 MSW 설정
 */
import { setupServer } from "msw/node";
import { handlers } from "./handlers.js";

// MSW 서버 인스턴스 생성
export const mockServer = setupServer(...handlers);

/**
 * MSW 서버 시작
 */
export function startMockServer() {
  mockServer.listen({
    onUnhandledRequest: "bypass", // 처리되지 않은 요청은 통과
  });
  console.log("MSW Mock Server started");
}

/**
 * MSW 서버 종료
 */
export function stopMockServer() {
  mockServer.close();
  console.log("MSW Mock Server stopped");
}
