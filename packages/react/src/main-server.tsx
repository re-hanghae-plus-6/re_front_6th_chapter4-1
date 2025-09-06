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

// 서버용 간단한 홈페이지 컴포넌트
// eslint-disable-next-line react-refresh/only-export-components
const ServerHomePage: React.FC<{ data: HomePageData }> = ({ data }) => {
  const { products, totalCount } = data;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <h1 className="text-xl font-bold text-gray-900 mb-4">
          <a href="/" data-link="/">
            쇼핑몰
          </a>
        </h1>

        {/* 검색바 */}
        <div className="mb-6">
          <input
            id="search-input"
            type="text"
            placeholder="상품 검색..."
            defaultValue={data.filters?.search || ""}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 현재 필터 정보 표시 */}
        {data.filters && (data.filters.category1 || data.filters.category2 || data.filters.search) && (
          <div className="mb-4 p-3 bg-blue-50 rounded-md">
            <h3 className="text-sm font-medium text-blue-900 mb-2">현재 필터:</h3>
            <div className="flex flex-wrap gap-2 text-sm">
              {data.filters.search && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">검색: "{data.filters.search}"</span>
              )}
              {data.filters.category1 && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded">{data.filters.category1}</span>
              )}
              {data.filters.category2 && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded">{data.filters.category2}</span>
              )}
            </div>
          </div>
        )}

        {/* 헤더 컨트롤 */}
        <div className="mb-4 flex justify-between items-center">
          <div className="flex space-x-4">
            <select
              id="limit-select"
              className="border border-gray-300 rounded px-2 py-1"
              defaultValue={data.filters?.limit?.toString() || "20"}
            >
              <option value="10">10개씩</option>
              <option value="20">20개씩</option>
              <option value="50">50개씩</option>
            </select>
            <select
              id="sort-select"
              className="border border-gray-300 rounded px-2 py-1"
              defaultValue={data.filters?.sort || "price_asc"}
            >
              <option value="price_asc">낮은 가격순</option>
              <option value="price_desc">높은 가격순</option>
              <option value="name_asc">이름순</option>
            </select>
          </div>
          <button id="cart-icon-btn" className="relative p-2 text-gray-700 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6h9M7 13l-1.5 6h9"
              />
            </svg>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              0
            </span>
          </button>
        </div>

        {/* 상품 목록 헤더 */}
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900">상품 목록</h2>
          <p className="text-sm text-gray-600">총 {totalCount}개 상품이 있습니다.</p>
        </div>

        {/* 상품 그리드 */}
        <div
          className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-x-8"
          data-testid="products-grid"
          id="products-grid"
        >
          {products.slice(0, 8).map((product, index) => (
            <div key={product.productId || index} className="group relative product-card">
              <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-gray-200 lg:aspect-none group-hover:opacity-75 lg:h-80">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.title}
                    className="h-full w-full object-cover object-center lg:h-full lg:w-full"
                  />
                ) : (
                  <div className="h-full w-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-500">상품 이미지</span>
                  </div>
                )}
              </div>
              <div className="mt-4 flex justify-between">
                <div>
                  <h3 className="text-sm text-gray-700">
                    <a href={`/product/${product.productId}/`} data-link={`/product/${product.productId}/`}>
                      <span aria-hidden="true" className="absolute inset-0"></span>
                      {product.title.length > 50 ? product.title.substring(0, 50) + "..." : product.title}
                    </a>
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">{product.category2}</p>
                </div>
                <p className="text-sm font-medium text-gray-900">₩{parseInt(product.lprice).toLocaleString()}</p>
              </div>
              <button className="add-to-cart-btn mt-2 w-full bg-indigo-600 text-white py-2 px-4 rounded hover:bg-indigo-700">
                장바구니에 담기
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 서버용 상품 상세 페이지 컴포넌트
// eslint-disable-next-line react-refresh/only-export-components
const ServerProductDetailPage: React.FC<{ data: ProductDetailData }> = ({ data }) => {
  const { product, relatedProducts } = data;

  return (
    <div className="bg-white">
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6 sm:py-24 lg:max-w-7xl lg:px-8">
        <h1 className="text-xl font-bold text-gray-900 mb-4">
          <a href="/" data-link="/">
            쇼핑몰
          </a>
        </h1>

        {/* 헤더 컨트롤 */}
        <div className="mb-4 flex justify-between items-center">
          <div className="flex space-x-4">
            <input
              id="search-input"
              type="text"
              placeholder="상품 검색..."
              className="px-3 py-1 border border-gray-300 rounded"
            />
            <select id="limit-select" className="border border-gray-300 rounded px-2 py-1">
              <option value="10">10개씩</option>
              <option value="20" selected>
                20개씩
              </option>
            </select>
            <select id="sort-select" className="border border-gray-300 rounded px-2 py-1">
              <option value="price_asc" selected>
                낮은 가격순
              </option>
              <option value="price_desc">높은 가격순</option>
            </select>
          </div>
          <button id="cart-icon-btn" className="relative p-2 text-gray-700 hover:text-gray-900">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6h9M7 13l-1.5 6h9"
              />
            </svg>
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              0
            </span>
          </button>
        </div>

        {/* 상품 상세 */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-x-8 lg:items-start">
          {/* 상품 이미지 */}
          <div className="flex flex-col-reverse">
            <div className="aspect-w-1 aspect-h-1 w-full">
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-center object-cover sm:rounded-lg"
              />
            </div>
          </div>

          {/* 상품 정보 */}
          <div className="mt-10 px-4 sm:px-0 sm:mt-16 lg:mt-0">
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">{product.title}</h1>
            <h2 className="text-lg font-semibold text-gray-900 mt-2">상품 상세</h2>

            <div className="mt-3">
              <p className="text-3xl text-gray-900">₩{parseInt(product.lprice).toLocaleString()}</p>
              <p className="text-lg text-gray-700">{parseInt(product.lprice)}원</p>
            </div>

            <div className="mt-6">
              <div>
                <h3 className="sr-only">상품 정보</h3>
                <div className="space-y-6 text-base text-gray-700">
                  <p>
                    <strong>브랜드:</strong> {product.brand || "정보 없음"}
                  </p>
                  <p>
                    <strong>판매처:</strong> {product.mallName}
                  </p>
                  <p>
                    <strong>카테고리:</strong> {product.category1} &gt; {product.category2}
                  </p>
                </div>
              </div>
            </div>

            {/* 수량 선택 */}
            <div className="mt-6">
              <div className="flex items-center space-x-3">
                <label htmlFor="quantity-input" className="text-sm font-medium text-gray-900">
                  수량:
                </label>
                <div className="flex items-center border border-gray-300 rounded">
                  <button type="button" id="quantity-decrease" className="px-3 py-1 text-gray-600 hover:text-gray-800">
                    -
                  </button>
                  <input
                    type="number"
                    id="quantity-input"
                    min="1"
                    defaultValue="1"
                    className="w-16 px-2 py-1 text-center border-0 focus:ring-0"
                  />
                  <button type="button" id="quantity-increase" className="px-3 py-1 text-gray-600 hover:text-gray-800">
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <button
                type="button"
                id="add-to-cart-btn"
                className="w-full bg-indigo-600 border border-transparent rounded-md py-3 px-8 flex items-center justify-center text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                장바구니에 담기
              </button>
            </div>
          </div>
        </div>

        {/* 관련 상품 */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-lg font-medium text-gray-900">관련 상품</h2>
            <div className="mt-6 grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8">
              {relatedProducts.map((relatedProduct: ProductDetailData["relatedProducts"][0]) => (
                <div key={relatedProduct.productId} className="group relative related-product-card">
                  <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-gray-200 lg:aspect-none group-hover:opacity-75 lg:h-80">
                    <img
                      src={relatedProduct.image}
                      alt={relatedProduct.title}
                      className="h-full w-full object-cover object-center lg:h-full lg:w-full"
                    />
                  </div>
                  <div className="mt-4 flex justify-between">
                    <div>
                      <h3 className="text-sm text-gray-700">
                        <a
                          href={`/product/${relatedProduct.productId}/`}
                          data-link={`/product/${relatedProduct.productId}/`}
                        >
                          <span aria-hidden="true" className="absolute inset-0"></span>
                          {relatedProduct.title.length > 30
                            ? relatedProduct.title.substring(0, 30) + "..."
                            : relatedProduct.title}
                        </a>
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">{relatedProduct.category2}</p>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      ₩{parseInt(relatedProduct.lprice).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
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
