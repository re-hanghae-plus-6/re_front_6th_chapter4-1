import { ServerRouter } from "./lib/ServerRouter.js";
import { registerRoutes } from "./router/routes.js";

// 서버 라우터 초기화
const serverRouter = new ServerRouter();
registerRoutes(serverRouter);

/**
 * 서버에서 데이터 프리페칭 - 새로운 SSR 메서드 사용
 */
async function prefetchData(route, params, query) {
  try {
    // 페이지 컴포넌트의 SSR 메서드 호출
    if (route.handler?.ssr) {
      console.log("SSR 데이터 프리페칭 시작:", route.path);
      const data = await route.handler.ssr({ params, query });
      console.log("SSR 데이터 프리페칭 완료:", route.path);
      return data;
    }

    // SSR 메서드가 없는 경우 빈 객체 반환
    console.log("SSR 메서드가 없는 페이지:", route.path);
    return {};
  } catch (error) {
    console.error("서버 데이터 프리페칭 실패:", error);
    return {
      loading: false,
      error: error.message,
      status: "done",
    };
  }
}

/**
 * 메타데이터 생성
 */
async function generateMetadata(route, params, data) {
  try {
    if (route.handler?.metadata) {
      return await route.handler.metadata({ params, data });
    }

    // 기본 메타데이터
    return {
      title: "쇼핑몰",
      description: "온라인 쇼핑몰",
    };
  } catch (error) {
    console.error("메타데이터 생성 실패:", error);
    return {
      title: "쇼핑몰",
      description: "온라인 쇼핑몰",
    };
  }
}

/**
 * 서버 사이드 렌더링
 */
export const render = async (pathname, query = {}) => {
  console.log("서버 렌더링:", { pathname, query });

  try {
    // 1. 라우터 시작 및 라우트 매칭
    serverRouter.start(pathname, query);
    const route = serverRouter.route;

    if (!route) {
      return {
        head: `<title>404 - 페이지를 찾을 수 없습니다</title>`,
        html: `<div class="min-h-screen bg-gray-50 flex items-center justify-center">
          <div class="text-center">
            <h1 class="text-2xl font-bold text-gray-900 mb-4">404</h1>
            <p class="text-gray-600">페이지를 찾을 수 없습니다.</p>
          </div>
        </div>`,
        __INITIAL_DATA__: {},
      };
    }

    // 2. 데이터 프리페칭
    console.log("라우트 매칭 결과:", route);
    const data = await prefetchData(route, route.params, query);

    // 3. 메타데이터 생성
    const metadata = await generateMetadata(route, route.params, data);

    // 4. 페이지 컴포넌트 렌더링
    const params = { pathname, query, params: route.params };
    const html = route.handler({ ...params, data });

    return {
      head: `
        <title>${metadata.title}</title>
        <meta name="description" content="${metadata.description}">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      `,
      html,
      __INITIAL_DATA__: data,
    };
  } catch (error) {
    console.error("서버 렌더링 오류:", error);
    return {
      head: `<title>오류 - 쇼핑몰</title>`,
      html: `<div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-red-600 mb-4">오류가 발생했습니다</h1>
          <p class="text-gray-600">잠시 후 다시 시도해주세요.</p>
        </div>
      </div>`,
      __INITIAL_DATA__: {},
    };
  }
};
