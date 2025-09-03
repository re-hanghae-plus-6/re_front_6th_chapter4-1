import { productStore } from "../src/stores/productStore.js";
import { serverStateManager } from "./stateManager.js";

/**
 * 서버 사이드 렌더링 함수
 */
export const render = async (url, query, vite = null) => {
  console.log("🚀 SSR Render 시작:", { url, query, timestamp: new Date().toISOString() });

  try {
    // URL 파싱 및 라우트 매칭
    const route = matchRoute(url);
    console.log("🎯 매칭된 라우트:", route);

    let result;
    if (route.type === "product-detail") {
      console.log("📦 상품 상세 페이지 렌더링");
      result = await renderProductDetail(route.params.id, query, vite);
    } else if (route.type === "home") {
      console.log("🏠 홈페이지 렌더링");
      result = await renderHomePage(query, vite);
    } else {
      console.log("❓ 알 수 없는 라우트, 404 페이지 렌더링");
      result = await renderNotFoundPage(vite);
    }

    return result;
  } catch (error) {
    console.error("❌ SSR Render Error:", error);
    return renderErrorPage(error);
  }
};

/**
 * 서버 사이드 렌더링 함수 (초기 데이터 포함)
 */
export const renderWithInitialData = async (url, query, vite = null) => {
  console.log("🚀 SSR Render with Initial Data 시작:", { url, query, timestamp: new Date().toISOString() });

  try {
    // URL 파싱 및 라우트 매칭
    const route = matchRoute(url);
    console.log("🎯 매칭된 라우트:", route);

    let appHtml, initialData;

    if (route.type === "product-detail") {
      console.log("📦 상품 상세 페이지 렌더링 (초기 데이터 포함)");
      const result = await renderProductDetailWithData(route.params.id, query, vite);
      appHtml = result.html;
      initialData = result.initialData;
    } else if (route.type === "home") {
      console.log("🏠 홈페이지 렌더링 (초기 데이터 포함)");
      const result = await renderHomePageWithData(query, vite);
      appHtml = result.html;
      initialData = result.initialData;
    } else {
      console.log("❓ 알 수 없는 라우트, 404 페이지 렌더링");
      appHtml = await renderNotFoundPage(vite);
      initialData = null;
    }

    return { appHtml, initialData };
  } catch (error) {
    console.error("❌ SSR Render with Initial Data Error:", error);
    return {
      appHtml: renderErrorPage(error),
      initialData: null,
    };
  }
};

/**
 * URL을 기반으로 라우트 매칭
 */
const matchRoute = (url) => {
  // 상품 상세 페이지 패턴: /product/:id/
  const productDetailMatch = url.match(/^\/product\/([^\/]+)\/?$/);
  if (productDetailMatch) {
    return {
      type: "product-detail",
      params: { id: productDetailMatch[1] },
    };
  }

  // 홈페이지 패턴: / 또는 /?query=...
  if (url === "/" || url.startsWith("/?")) {
    return {
      type: "home",
      params: {},
    };
  }

  // 매칭되지 않는 경우
  return {
    type: "not-found",
    params: {},
  };
};

/**
 * 홈페이지 렌더링
 */
const renderHomePage = async (query, vite = null) => {
  // 서버 상태 관리자를 통해 상태 초기화
  const state = await serverStateManager.initializeHomeState(query);

  // SSR용 HomePage 컴포넌트 동적 import
  let HomePage;
  if (vite) {
    console.log("🔧 Vite SSR 모듈 로딩 (HomePage)");
    const module = await vite.ssrLoadModule("./src/pages/HomePage.js");
    HomePage = module.HomePage;
  } else {
    console.log("📦 일반 모듈 로딩 (HomePage)");
    const module = await import("../src/pages/HomePage.js");
    HomePage = module.HomePage;
  }

  console.log("🎨 홈페이지 컴포넌트 렌더링 시작");
  const html = HomePage("", query, state);

  console.log("✅ 홈페이지 SSR 렌더링 완료, HTML 길이:", html.length);
  return html;
};

/**
 * 홈페이지 렌더링 (초기 데이터 포함)
 */
const renderHomePageWithData = async (query, vite = null) => {
  // 서버 상태 관리자를 통해 상태 초기화
  const state = await serverStateManager.initializeHomeState(query);

  // SSR용 HomePage 컴포넌트 동적 import
  let HomePage;
  if (vite) {
    console.log("🔧 Vite SSR 모듈 로딩 (HomePage)");
    const module = await vite.ssrLoadModule("./src/pages/HomePage.js");
    HomePage = module.HomePage;
  } else {
    console.log("📦 일반 모듈 로딩 (HomePage)");
    const module = await import("../src/pages/HomePage.js");
    HomePage = module.HomePage;
  }

  console.log("🎨 홈페이지 컴포넌트 렌더링 시작 (초기 데이터 포함)");

  // 서버 상태를 productStore에 주입
  productStore.dispatch({
    type: "SETUP",
    payload: {
      products: state.products,
      totalCount: state.totalCount,
      loading: false,
      error: null,
      status: "done",
      categories: state.categories,
    },
  });

  const html = HomePage("", query, state);

  console.log("✅ 홈페이지 SSR 렌더링 완료 (초기 데이터 포함), HTML 길이:", html.length);

  return {
    html,
    initialData: {
      type: "home",
      state,
      query,
      timestamp: new Date().toISOString(),
    },
  };
};

/**
 * 상품 상세 페이지 렌더링
 */
const renderProductDetail = async (productId, query, vite = null) => {
  // 서버 상태 관리자를 통해 상태 초기화
  const state = await serverStateManager.initializeProductDetailState(productId);

  // SSR용 ProductDetailPage 컴포넌트 동적 import
  let ProductDetailPage;
  if (vite) {
    console.log("🔧 Vite SSR 모듈 로딩 (ProductDetailPage)");
    const module = await vite.ssrLoadModule("./src/pages/ProductDetailPage.js");
    ProductDetailPage = module.ProductDetailPage;
  } else {
    console.log("📦 일반 모듈 로딩 (ProductDetailPage)");
    const module = await import("../src/pages/ProductDetailPage.js");
    ProductDetailPage = module.ProductDetailPage;
  }

  console.log("🎨 상품 상세 컴포넌트 렌더링 시작");
  const html = ProductDetailPage(`/product/${productId}/`, query, state);

  console.log("✅ 상품 상세 SSR 렌더링 완료, HTML 길이:", html.length);
  return html;
};

/**
 * 상품 상세 페이지 렌더링 (초기 데이터 포함)
 */
const renderProductDetailWithData = async (productId, query, vite = null) => {
  // 서버 상태 관리자를 통해 상태 초기화
  const state = await serverStateManager.initializeProductDetailState(productId);

  // SSR용 ProductDetailPage 컴포넌트 동적 import
  let ProductDetailPage;
  if (vite) {
    console.log("🔧 Vite SSR 모듈 로딩 (ProductDetailPage)");
    const module = await vite.ssrLoadModule("./src/pages/ProductDetailPage.js");
    ProductDetailPage = module.ProductDetailPage;
  } else {
    console.log("📦 일반 모듈 로딩 (ProductDetailPage)");
    const module = await import("../src/pages/ProductDetailPage.js");
    ProductDetailPage = module.ProductDetailPage;
  }

  console.log("🎨 상품 상세 컴포넌트 렌더링 시작 (초기 데이터 포함)");

  // 서버 상태를 productStore에 주입
  productStore.dispatch({
    type: "SETUP",
    payload: {
      currentProduct: state.product,
      relatedProducts: [],
      loading: false,
      error: null,
      status: "done",
      categories: state.categories,
    },
  });

  const html = ProductDetailPage(`/product/${productId}/`, query, state);

  console.log("✅ 상품 상세 SSR 렌더링 완료 (초기 데이터 포함), HTML 길이:", html.length);

  return {
    html,
    initialData: {
      type: "product-detail",
      state,
      query,
      productId,
      timestamp: new Date().toISOString(),
    },
  };
};

/**
 * 404 페이지 렌더링
 */
const renderNotFoundPage = async (vite = null) => {
  console.log("❓ 404 페이지 렌더링");

  // SSR용 NotFoundPage 컴포넌트 동적 import
  let NotFoundPage;
  if (vite) {
    console.log("🔧 Vite SSR 모듈 로딩 (NotFoundPage)");
    const module = await vite.ssrLoadModule("./src/pages/NotFoundPage.js");
    NotFoundPage = module.NotFoundPage;
  } else {
    console.log("📦 일반 모듈 로딩 (NotFoundPage)");
    const module = await import("../src/pages/NotFoundPage.js");
    NotFoundPage = module.NotFoundPage;
  }

  console.log("🎨 404 컴포넌트 렌더링 시작");
  const html = NotFoundPage(
    "",
    {},
    {
      loading: false,
      status: "done",
    },
  );

  console.log("✅ 404 SSR 렌더링 완료, HTML 길이:", html.length);
  return html;
};

/**
 * 에러 페이지 렌더링
 */
const renderErrorPage = (error) => {
  return `
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-red-600 mb-4">오류가 발생했습니다</h1>
        <p class="text-gray-600">${error.message}</p>
      </div>
    </div>
  `;
};
