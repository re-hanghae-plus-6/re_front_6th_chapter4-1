/**
 * 서버사이드 렌더링 전용 페이지 컴포넌트들
 * 클라이언트 의존성 없이 순수 HTML 문자열 반환
 */

// 서버용 PageWrapper (클라이언트 의존성 제거)
const ServerPageWrapper = ({ headerLeft = "", children = "" }) => {
  return `
    <div class="min-h-screen bg-gray-50">
      <!-- 헤더 -->
      <header class="bg-white shadow-sm border-b border-gray-200">
        <div class="max-w-md mx-auto px-4 h-14 flex items-center justify-between">
          <div class="flex items-center">
            ${headerLeft}
          </div>
          <div class="flex items-center space-x-2">
            <button class="relative p-2 text-gray-700 hover:text-gray-900">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4m1.6 8L5 3H3m4 10v6a1 1 0 001 1h10a1 1 0 001-1v-6M9 19v2a1 1 0 002 0v-2m0 0V9a1 1 0 012 0v10m-4 0a1 1 0 002 0z"/>
              </svg>
              <span class="absolute -top-1 -right-1 bg-blue-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                0
              </span>
            </button>
          </div>
        </div>
      </header>

      <!-- 메인 콘텐츠 -->
      <main class="max-w-md mx-auto px-4 py-6">
        ${children}
      </main>
    </div>
  `;
};

// 서버용 SearchBar 컴포넌트
const ServerSearchBar = ({ searchQuery = "", sort = "price_asc", category = {}, categories = {} }) => {
  const { category1 = "" } = category;

  return `
    <div class="bg-white rounded-lg shadow-sm p-4 mb-4">
      <!-- 검색바 -->
      <div class="mb-4">
        <div class="relative">
          <input
            type="text"
            value="${searchQuery}"
            placeholder="상품을 검색하세요"
            class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
          <svg class="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
      </div>

      <!-- 필터 -->
      <div class="grid grid-cols-2 gap-3 mb-4">
        <!-- 카테고리 1 -->
        <select class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
          <option value="">전체 카테고리</option>
          ${Object.keys(categories)
            .map((cat1) => `<option value="${cat1}" ${category1 === cat1 ? "selected" : ""}>${cat1}</option>`)
            .join("")}
        </select>

        <!-- 정렬 -->
        <select class="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
          <option value="price_asc" ${sort === "price_asc" ? "selected" : ""}>가격 낮은순</option>
          <option value="price_desc" ${sort === "price_desc" ? "selected" : ""}>가격 높은순</option>
          <option value="title_asc" ${sort === "title_asc" ? "selected" : ""}>이름순</option>
        </select>
      </div>
    </div>
  `;
};

// 서버용 ProductList 컴포넌트
const ServerProductList = ({ products = [], loading = false, error = null, totalCount = 0 }) => {
  if (loading) {
    return `<div class="text-center py-8">로딩 중...</div>`;
  }

  if (error) {
    return `<div class="text-center py-8 text-red-600">오류: ${error}</div>`;
  }

  if (products.length === 0) {
    return `<div class="text-center py-8 text-gray-600">상품이 없습니다.</div>`;
  }

  return `
    <div class="space-y-4">
      <!-- 상품 목록 -->
      <div class="grid grid-cols-2 gap-4">
        ${products
          .map(
            (product) => `
          <a href="/product/${product.productId}/" class="group block bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
            <div class="aspect-square bg-gray-100 overflow-hidden">
              <img src="${product.image}" alt="${product.title}" 
                   class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
            </div>
            <div class="p-3">
              <h3 class="text-sm font-medium text-gray-900 line-clamp-2 mb-1">${product.title}</h3>
              <p class="text-xs text-gray-600 mb-2">${product.brand}</p>
              <p class="text-sm font-bold text-blue-600">${Number(product.lprice).toLocaleString()}원</p>
            </div>
          </a>
        `,
          )
          .join("")}
      </div>

      <!-- 상품 수 표시 -->
      <div class="text-center text-sm text-gray-600 py-4">
        총 ${totalCount}개 상품 중 ${products.length}개 표시
      </div>
    </div>
  `;
};

// 서버용 홈페이지
export const ServerHomePage = (initialData) => {
  const { products = [], totalCount = 0, categories = {}, loading = false, error = null } = initialData || {};
  const query = { search: "", limit: 20, sort: "price_asc", category1: "", category2: "" };
  const { search: searchQuery, limit, sort, category1, category2 } = query;
  const category = { category1, category2 };

  return ServerPageWrapper({
    headerLeft: `
      <h1 class="text-xl font-bold text-gray-900">
        <a href="/">쇼핑몰 (SSR)</a>
      </h1>
    `,
    children: `
      <!-- 검색 및 필터 -->
      ${ServerSearchBar({ searchQuery, limit, sort, category, categories })}
      
      <!-- 상품 목록 -->
      <div class="mb-6">
        ${ServerProductList({ products, loading, error, totalCount })}
      </div>
    `,
  });
};

// 서버용 상품 상세 페이지
export const ServerProductDetailPage = (initialData) => {
  const { currentProduct: product, relatedProducts = [], error, loading = false } = initialData || {};

  if (loading) {
    return ServerPageWrapper({
      headerLeft: `<h1 class="text-lg font-bold text-gray-900">상품 상세</h1>`,
      children: `<div class="text-center py-8">로딩 중...</div>`,
    });
  }

  if (error && !product) {
    return ServerPageWrapper({
      headerLeft: `<h1 class="text-lg font-bold text-gray-900">상품 상세</h1>`,
      children: `
        <div class="text-center py-8">
          <h1 class="text-xl font-bold text-gray-900 mb-2">상품을 찾을 수 없습니다</h1>
          <p class="text-gray-600 mb-4">${error || "요청하신 상품이 존재하지 않습니다."}</p>
          <a href="/" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">홈으로</a>
        </div>
      `,
    });
  }

  if (!product) {
    return ServerPageWrapper({
      headerLeft: `<h1 class="text-lg font-bold text-gray-900">상품 상세</h1>`,
      children: `<div class="text-center py-8 text-red-600">상품 정보를 불러올 수 없습니다.</div>`,
    });
  }

  const price = Number(product.lprice);

  return ServerPageWrapper({
    headerLeft: `
      <div class="flex items-center space-x-3">
        <button onclick="window.history.back()" class="p-2 text-gray-700 hover:text-gray-900">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </button>
        <h1 class="text-lg font-bold text-gray-900">상품 상세 (SSR)</h1>
      </div>
    `,
    children: `
      <!-- 상품 상세 정보 -->
      <div class="bg-white rounded-lg shadow-sm mb-6">
        <div class="p-4">
          <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
            <img src="${product.image}" alt="${product.title}" class="w-full h-full object-cover">
          </div>
          
          <div>
            <p class="text-sm text-gray-600 mb-1">${product.brand}</p>
            <h1 class="text-xl font-bold text-gray-900 mb-3">${product.title}</h1>
            <div class="mb-4">
              <span class="text-2xl font-bold text-blue-600">${price.toLocaleString()}원</span>
            </div>
            <div class="text-sm text-gray-600 mb-4">
              카테고리: ${product.category1} > ${product.category2}
            </div>
          </div>
        </div>
        
        <!-- 액션 버튼 -->
        <div class="border-t border-gray-200 p-4">
          <button class="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 font-medium">
            장바구니 담기
          </button>
        </div>
      </div>

      <!-- 관련 상품 -->
      ${
        relatedProducts.length > 0
          ? `
        <div class="bg-white rounded-lg shadow-sm">
          <div class="p-4 border-b border-gray-200">
            <h2 class="text-lg font-bold text-gray-900">관련 상품</h2>
            <p class="text-sm text-gray-600">같은 카테고리의 다른 상품들 (${relatedProducts.length}개)</p>
          </div>
          <div class="p-4">
            <div class="grid grid-cols-2 gap-3">
              ${relatedProducts
                .slice(0, 4)
                .map(
                  (relatedProduct) => `
                <a href="/product/${relatedProduct.productId}/" class="bg-gray-50 rounded-lg p-3 hover:bg-gray-100">
                  <div class="aspect-square bg-white rounded-md overflow-hidden mb-2">
                    <img src="${relatedProduct.image}" alt="${relatedProduct.title}" 
                         class="w-full h-full object-cover">
                  </div>
                  <h3 class="text-sm font-medium text-gray-900 mb-1 line-clamp-2">${relatedProduct.title}</h3>
                  <p class="text-sm font-bold text-blue-600">${Number(relatedProduct.lprice).toLocaleString()}원</p>
                </a>
              `,
                )
                .join("")}
            </div>
          </div>
        </div>
      `
          : ""
      }
    `,
  });
};
