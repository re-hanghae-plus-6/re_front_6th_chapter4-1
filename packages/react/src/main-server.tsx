// 서버 환경에서 필요한 전역 객체들을 먼저 설정 (다른 모듈 import 전에)
if (typeof global !== "undefined") {
  // window 객체 mock (서버에서 클라이언트 코드가 실행될 때 필요)
  if (typeof global.window === "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).window = {
      location: { pathname: "/", search: "", href: "" },
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => {},
      history: {
        pushState: () => {},
        replaceState: () => {},
        back: () => {},
        forward: () => {},
      },
      localStorage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
      },
      sessionStorage: {
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
      },
      __INITIAL_DATA__: undefined,
    };
  }

  // document 객체 mock
  if (typeof global.document === "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).document = {
      createElement: () => ({ setAttribute: () => {}, style: {} }),
      addEventListener: () => {},
      removeEventListener: () => {},
      getElementById: () => null,
      querySelector: () => null,
      querySelectorAll: () => [],
    };
  }

  // navigator 객체 mock
  if (typeof global.navigator === "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).navigator = {
      userAgent: "Node.js SSR",
    };
  }
}

import { renderToString } from "react-dom/server";
import * as React from "react";
import { loadHomePageData, loadProductDetailData } from "./ssr-data";
import type { HomePageData, ProductDetailData } from "./ssr-data";
// 서버에서는 App과 router를 직접 import하지 않고 필요할 때 동적으로 로드

// eslint-disable-next-line react-refresh/only-export-components
const ServerHomePage: React.FC<{ data: HomePageData }> = ({ data }) => {
  const { products, categories, totalCount } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - CSR의 PageWrapper와 동일한 구조 */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">
              <a href="/" data-link="/">
                쇼핑몰
              </a>
            </h1>
            <div className="flex items-center space-x-2">
              {/* 장바구니 아이콘 */}
              <button id="cart-icon-btn" className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m9.5-6h.01M17 21a2 2 0 100-4 2 2 0 000 4z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - CSR의 PageWrapper와 동일한 구조 */}
      <main className="max-w-md mx-auto px-4 py-4">
        {/* 검색 및 필터 - CSR의 SearchBar와 유사한 구조 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          {/* 검색바 */}
          <div className="mb-4">
            <div className="relative">
              <input
                id="search-input"
                type="text"
                placeholder="상품 검색..."
                defaultValue={data.filters?.search || ""}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* 필터 및 정렬 옵션 */}
          <div className="flex gap-2 items-center justify-between mb-4">
            <select
              id="limit-select"
              defaultValue={data.filters?.limit?.toString() || "20"}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="10">10개</option>
              <option value="20">20개</option>
              <option value="50">50개</option>
            </select>

            <select
              id="sort-select"
              defaultValue={data.filters?.sort || "price_asc"}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="price_asc">가격 낮은순</option>
              <option value="price_desc">가격 높은순</option>
              <option value="name_asc">이름순</option>
            </select>
          </div>

          {/* 카테고리 필터 */}
          <div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">카테고리</h3>
            <div className="flex flex-wrap gap-2">
              {Object.keys(categories).length > 0 ? (
                Object.keys(categories).map((categoryKey) => (
                  <button
                    key={categoryKey}
                    className="category1-filter-btn text-left px-3 py-2 text-sm rounded-md border transition-colors bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    {categoryKey}
                  </button>
                ))
              ) : (
                <div className="text-sm text-gray-500 italic">카테고리 로딩 중...</div>
              )}
            </div>
          </div>
        </div>

        {/* 상품 목록 - CSR의 ProductList와 유사한 구조 */}
        <div className="mb-6">
          {/* 상품 개수 정보 */}
          {totalCount > 0 && (
            <div className="mb-4 text-sm text-gray-600">
              총 <span className="font-medium text-gray-900">{totalCount.toLocaleString()}개</span>의 상품
            </div>
          )}

          {/* 상품 그리드 - CSR과 동일한 2열 그리드 */}
          <div className="grid grid-cols-2 gap-4 mb-6" id="products-grid">
            {products.slice(0, 8).map((product, index) => (
              <div
                key={product.productId || index}
                className="group relative product-card bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
              >
                <div className="aspect-square w-full bg-gray-100 relative">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  ) : (
                    <div className="h-full w-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-500 text-sm">상품 이미지</span>
                    </div>
                  )}
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                    <a href={`/product/${product.productId}/`} data-link={`/product/${product.productId}/`}>
                      {product.title.length > 40 ? product.title.substring(0, 40) + "..." : product.title}
                    </a>
                  </h3>
                  <p className="text-xs text-gray-500 mb-2">{product.category2}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-900">
                      ₩{parseInt(product.lprice).toLocaleString()}
                    </span>
                    <button className="px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors add-to-cart-btn">
                      담기
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-md mx-auto px-4">
          <div className="text-center text-sm text-gray-600">
            <p>&copy; 2024 쇼핑몰. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// 서버용 상품 상세 페이지 컴포넌트 - CSR과 동일한 스타일 적용
// eslint-disable-next-line react-refresh/only-export-components
const ServerProductDetailPage: React.FC<{ data: ProductDetailData }> = ({ data }) => {
  const { product, relatedProducts } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - CSR의 PageWrapper와 동일한 구조 */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <button className="p-2 text-gray-700 hover:text-gray-900 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-lg font-bold text-gray-900">상품 상세</h1>
            </div>
            <div className="flex items-center space-x-2">
              {/* 장바구니 아이콘 */}
              <button className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m9.5-6h.01M17 21a2 2 0 100-4 2 2 0 000 4z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 py-4">
        {/* 상품 상세 정보 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden mb-6">
          {/* 상품 이미지 */}
          <div className="aspect-square w-full bg-gray-100 relative">
            {product.image ? (
              <img src={product.image} alt={product.title} className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-500">상품 이미지</span>
              </div>
            )}
          </div>

          {/* 상품 정보 */}
          <div className="p-4">
            <h1 className="text-lg font-bold text-gray-900 mb-2">{product.title}</h1>

            <div className="mb-4">
              <p className="text-2xl font-bold text-blue-600 mb-1">₩{parseInt(product.lprice).toLocaleString()}</p>
              <p className="text-lg text-gray-700">{parseInt(product.lprice)}원</p>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">브랜드:</span> {product.brand || "정보 없음"}
                </p>
                <p>
                  <span className="font-medium">판매처:</span> {product.mallName}
                </p>
                <p>
                  <span className="font-medium">카테고리:</span> {product.category1} &gt; {product.category2}
                </p>
              </div>
            </div>

            {/* 수량 선택 */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-900 mb-2">수량</label>
              <div className="flex items-center border border-gray-300 rounded-md w-32">
                <button
                  type="button"
                  id="quantity-decrease"
                  className="px-3 py-2 text-gray-600 hover:text-gray-800 border-r border-gray-300"
                >
                  -
                </button>
                <input
                  type="number"
                  id="quantity-input"
                  min="1"
                  defaultValue="1"
                  className="flex-1 px-3 py-2 text-center border-0 focus:ring-0 focus:outline-none"
                />
                <button
                  type="button"
                  id="quantity-increase"
                  className="px-3 py-2 text-gray-600 hover:text-gray-800 border-l border-gray-300"
                >
                  +
                </button>
              </div>
            </div>

            {/* 장바구니 담기 버튼 */}
            <button
              type="button"
              id="add-to-cart-btn"
              className="w-full bg-blue-500 text-white py-3 px-4 rounded-md hover:bg-blue-600 transition-colors font-medium"
            >
              장바구니에 추가
            </button>
          </div>
        </div>

        {/* 관련 상품 */}
        {relatedProducts.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">관련 상품</h2>
            <div className="grid grid-cols-2 gap-4">
              {relatedProducts.map((relatedProduct: ProductDetailData["relatedProducts"][0]) => (
                <div
                  key={relatedProduct.productId}
                  className="group relative related-product-card bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <div className="aspect-square w-full bg-gray-100 relative">
                    <img
                      src={relatedProduct.image}
                      alt={relatedProduct.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
                      <a
                        href={`/product/${relatedProduct.productId}/`}
                        data-link={`/product/${relatedProduct.productId}/`}
                      >
                        {relatedProduct.title.length > 30
                          ? relatedProduct.title.substring(0, 30) + "..."
                          : relatedProduct.title}
                      </a>
                    </h3>
                    <p className="text-xs text-gray-500 mb-2">{relatedProduct.category2}</p>
                    <p className="text-sm font-bold text-gray-900">
                      ₩{parseInt(relatedProduct.lprice).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-md mx-auto px-4">
          <div className="text-center text-sm text-gray-600">
            <p>&copy; 2024 쇼핑몰. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// 404 페이지
// eslint-disable-next-line react-refresh/only-export-components
const ServerNotFoundPage: React.FC = () => {
  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <h1 className="text-xl font-bold text-gray-900 mb-4">
          <a href="/" data-link="/">
            쇼핑몰
          </a>
        </h1>
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">404 - 페이지를 찾을 수 없습니다</h2>
          <p className="mt-4 text-lg text-gray-500">요청하신 페이지가 존재하지 않습니다.</p>
          <div className="mt-6">
            <a href="/" data-link="/" className="text-indigo-600 hover:text-indigo-500">
              홈으로 돌아가기
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export const render = async (url: string) => {
  console.log("SSR: Rendering URL:", url);

  try {
    // 서버에서 URL 파싱 - Base URL 처리 개선
    let urlPath = url.split("?")[0];

    // Base URL 제거 (예: /front_6th_chapter4-1/react/ -> /)
    if (urlPath.includes("/front_6th_chapter4-1/react/")) {
      urlPath = urlPath.replace("/front_6th_chapter4-1/react", "");
    }

    // 빈 경로는 홈으로 처리
    if (!urlPath || urlPath === "/") {
      urlPath = "/";
    }

    console.log("SSR: Processed URL path:", urlPath);

    // 데이터 프리로딩
    let html = "";
    let head = "";
    let initialData = "";

    const productMatch = urlPath.match(/^\/product\/([^/]+)\/?$/);

    if (productMatch) {
      // 상품 상세 페이지
      const productId = productMatch[1];
      console.log("SSR: Loading product data for ID:", productId);

      const productData = await loadProductDetailData(productId);
      if (productData) {
        html = renderToString(<ServerProductDetailPage data={productData} />);
        head = `<title>${productData.product.title} - 쇼핑몰</title><meta name="description" content="${productData.product.title}" />`;
        initialData = JSON.stringify({
          type: "product",
          data: productData,
          url: url,
        });
      } else {
        html = renderToString(<ServerNotFoundPage />);
        head = "<title>상품을 찾을 수 없습니다 - 쇼핑몰</title>";
        initialData = JSON.stringify({
          type: "notfound",
          data: null,
          url: url,
        });
      }
    } else if (urlPath === "/" || urlPath === "") {
      // 홈페이지
      console.log("SSR: Loading home page data");

      const homeData = await loadHomePageData(url);
      if (homeData) {
        html = renderToString(<ServerHomePage data={homeData} />);
        head =
          '<title>쇼핑몰 - 홈</title><meta name="description" content="최고의 쇼핑몰에서 다양한 상품을 만나보세요" />';

        // 필터 정보는 homeData에서 가져오기 (이미 디코딩됨)
        const filters = homeData.filters || {
          search: "",
          category1: "",
          category2: "",
          sort: "price_asc",
          limit: 20,
          page: 1,
        };

        initialData = JSON.stringify({
          type: "home",
          data: homeData,
          url: url,
          filters: filters,
        });
      } else {
        throw new Error("Failed to load home page data");
      }
    } else {
      // 404 페이지
      console.log("SSR: 404 page for:", urlPath);
      html = renderToString(<ServerNotFoundPage />);
      head = "<title>페이지를 찾을 수 없습니다 - 쇼핑몰</title>";
      initialData = JSON.stringify({
        type: "notfound",
        data: null,
        url: url,
      });
    }

    console.log("SSR: Rendered HTML length:", html.length);
    console.log('SSR: HTML contains "총":', html.includes("총"));
    console.log('SSR: HTML contains "쇼핑몰":', html.includes("쇼핑몰"));

    return { html, head, initialData };
  } catch (error) {
    console.error("SSR Error:", error);

    // 에러 발생 시 기본 에러 페이지 렌더링
    const html = renderToString(
      <div className="bg-white">
        <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
          <h1 className="text-xl font-bold text-gray-900 mb-4">
            <a href="/" data-link="/">
              쇼핑몰
            </a>
          </h1>
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">서버 오류가 발생했습니다</h2>
            <p className="mt-4 text-lg text-gray-500">잠시 후 다시 시도해 주세요.</p>
            <div className="mt-6">
              <a href="/" data-link="/" className="text-indigo-600 hover:text-indigo-500">
                홈으로 돌아가기
              </a>
            </div>
          </div>
        </div>
      </div>,
    );

    const head = '<title>서버 오류 - 쇼핑몰</title><meta name="description" content="서버 오류가 발생했습니다." />';
    const initialData = JSON.stringify({
      type: "error",
      data: null,
      url: url,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return { html, head, initialData };
  }
};
