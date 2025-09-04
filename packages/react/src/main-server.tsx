import React from "react";
import { renderToString } from "react-dom/server";
import { ServerRouter } from "./router/ServerRouter";
import { registerServerRoutes } from "./router/routes";
import type { SSRResult, SSRContext, MetaData } from "./types/ssr";

/**
 * 서버에서 데이터 프리페칭 - 바닐라 패턴을 React로 적용
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function prefetchData(route: any, params: Record<string, string>, query: Record<string, string>) {
  try {
    // 페이지 컴포넌트의 SSR 메서드 호출
    if (route.handler?.ssr) {
      console.log("SSR 데이터 프리페칭 시작:", route.path);
      const data = await route.handler.ssr({ params, query } as SSRContext);
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
      error: error instanceof Error ? error.message : "Unknown error",
      status: "error",
    };
  }
}

/**
 * 메타데이터 생성 - 바닐라 패턴을 React로 적용
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function generateMetadata(route: any, params: Record<string, string>, data: any): Promise<MetaData> {
  try {
    if (route.handler?.metadata) {
      return await route.handler.metadata({ data, params });
    }

    // 기본 메타데이터
    return {
      title: "쇼핑몰",
      description: "온라인 쇼핑몰",
      keywords: "쇼핑, 온라인 쇼핑몰",
    };
  } catch (error) {
    console.error("메타데이터 생성 실패:", error);
    return {
      title: "쇼핑몰",
      description: "온라인 쇼핑몰",
      keywords: "쇼핑, 온라인 쇼핑몰",
    };
  }
}

/**
 * 서버 사이드 렌더링 - 바닐라 main-server.js와 동일한 구조
 */
export const render = async (pathname: string, query: Record<string, string> = {}): Promise<SSRResult> => {
  console.log("React 서버 렌더링:", { pathname, query });

  try {
    // 1. 요청마다 새로운 서버 라우터 인스턴스 생성 (상태 격리)
    const serverRouter = new ServerRouter();
    registerServerRoutes(serverRouter);

    // 2. 라우터 시작 및 라우트 매칭
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

    // 3. 데이터 프리페칭
    console.log("라우트 매칭 결과:", route);
    const data = await prefetchData(route, route.params || {}, query);

    console.log("데이터 프리페칭 결과:", data);
    // 4. 메타데이터 생성
    const metadata = await generateMetadata(route, route.params || {}, data);

    // 5. 실제 React 컴포넌트 서버 렌더링
    console.log("React 컴포넌트 서버 렌더링 시작");

    let html: string;

    // 라우트에 따라 적절한 컴포넌트 렌더링
    if (route.path === "/") {
      // HomePage 렌더링
      const { HomePage } = await import("./pages/HomePage");
      html = renderToString(
        <HomePage
          ssrData={{
            products: data.products || [],
            categories: data.categories || {},
            totalCount: data.totalCount || 0,
          }}
          ssrQuery={query}
        />,
      );
    } else if (route.path === "/product/:id/") {
      // ProductDetailPage 렌더링
      const { ProductDetailPage } = await import("./pages/ProductDetailPage");
      html = renderToString(
        <ProductDetailPage
          ssrData={{
            currentProduct: data.currentProduct || null,
            relatedProducts: data.relatedProducts || [],
          }}
        />,
      );
    } else {
      // NotFoundPage 렌더링
      const { NotFoundPage } = await import("./pages/NotFoundPage");
      html = renderToString(<NotFoundPage />);
    }

    return {
      head: `
        <title>${metadata.title}</title>
        <meta name="description" content="${metadata.description}">
        <meta name="keywords" content="${metadata.keywords || ""}">
        ${metadata.image ? `<meta property="og:image" content="${metadata.image}">` : ""}
        <meta name="viewport" content="width=device-width, initial-scale=1">
      `,
      html,
      __INITIAL_DATA__: {
        ...data,
        // SSR 쿼리 정보를 클라이언트에 전달
        __SSR_QUERY__: query,
      },
    };
  } catch (error) {
    console.error("React 서버 렌더링 오류:", error);
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
