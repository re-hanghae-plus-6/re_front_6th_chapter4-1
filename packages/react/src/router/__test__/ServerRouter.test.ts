/**
 * ServerRouter 기본 동작 검증 테스트
 */
import { ServerRouter } from "../ServerRouter";
import type { SSRPageComponent } from "../../types/ssr";

// 테스트용 더미 컴포넌트들
const DummyHomePage: SSRPageComponent = () => null;
const DummyProductPage: SSRPageComponent = () => null;
const DummyNotFoundPage: SSRPageComponent = () => null;

console.log("🧪 ServerRouter 기본 동작 테스트 시작");

// 1. 서버 라우터 인스턴스 생성 테스트
const serverRouter = new ServerRouter();
console.log("✅ ServerRouter 인스턴스 생성 성공");

// 2. 라우트 등록 테스트
serverRouter.addRoute("/", DummyHomePage);
serverRouter.addRoute("/product/:id/", DummyProductPage);
serverRouter.addRoute(".*", DummyNotFoundPage);
console.log("✅ 라우트 등록 완료");

// 3. 라우트 매칭 테스트
const testCases = [
  { url: "/", expectedName: "DummyHomePage", params: {} },
  { url: "/product/123/", expectedName: "DummyProductPage", params: { id: "123" } },
  { url: "/invalid-path", expectedName: "DummyNotFoundPage", params: {} },
];

testCases.forEach(({ url, expectedName, params }) => {
  const route = serverRouter.findRoute(url);

  if (route) {
    console.log(`✅ ${url} -> ${route.handler?.name || "Unknown"} (예상: ${expectedName})`);

    // 파라미터 검증
    const paramsMatch = JSON.stringify(route.params) === JSON.stringify(params);
    if (paramsMatch) {
      console.log(`✅ 파라미터 매칭 성공: ${JSON.stringify(route.params)}`);
    } else {
      console.log(`❌ 파라미터 매칭 실패: 예상 ${JSON.stringify(params)}, 실제 ${JSON.stringify(route.params)}`);
    }
  } else {
    console.log(`❌ ${url} -> 라우트 매칭 실패`);
  }
});

// 4. 라우터 시작 테스트
serverRouter.start("/product/456/", { search: "test" });
console.log("✅ 라우터 시작 테스트 완료");
console.log("현재 라우트:", serverRouter.route?.path);
console.log("현재 파라미터:", serverRouter.params);

console.log("🎉 ServerRouter 기본 동작 테스트 완료");

export {}; // 모듈로 만들기 위한 export
