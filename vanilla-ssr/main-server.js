const createObserver = () => {
	const listeners = /* @__PURE__ */ new Set();
	const subscribe = (fn) => listeners.add(fn);
	const notify = () => listeners.forEach((listener) => listener());
	return {
		subscribe,
		notify
	};
};
var Router = class Router {
	#routes;
	#route;
	#observer = createObserver();
	#baseUrl;
	constructor(baseUrl = "") {
		this.#routes = /* @__PURE__ */ new Map();
		this.#route = null;
		this.#baseUrl = baseUrl.replace(/\/$/, "");
		if (typeof window !== "undefined") window.addEventListener("popstate", () => {
			this.#route = this.#findRoute();
			this.#observer.notify();
		});
	}
	get baseUrl() {
		return this.#baseUrl;
	}
	get query() {
		return Router.parseQuery(typeof window !== "undefined" ? window.location.search : "");
	}
	set query(newQuery) {
		const newUrl = Router.getUrl(newQuery, this.#baseUrl);
		this.push(newUrl);
	}
	get params() {
		return this.#route?.params ?? {};
	}
	get route() {
		return this.#route;
	}
	get target() {
		return this.#route?.handler;
	}
	subscribe(fn) {
		this.#observer.subscribe(fn);
	}
	addRoute(path, handler) {
		const paramNames = [];
		const regexPath = path.replace(/:\w+/g, (match) => {
			paramNames.push(match.slice(1));
			return "([^/]+)";
		}).replace(/\//g, "\\/");
		const regex = /* @__PURE__ */ new RegExp(`^${this.#baseUrl}${regexPath}$`);
		this.#routes.set(path, {
			regex,
			paramNames,
			handler
		});
	}
	#findRoute(url = window.location.pathname) {
		const { pathname } = new URL(url, typeof window !== "undefined" ? window.location.origin : "http://localhost");
		for (const [routePath, route] of this.#routes) {
			const match = pathname.match(route.regex);
			if (match) {
				const params = {};
				route.paramNames.forEach((name, index) => {
					params[name] = match[index + 1];
				});
				return {
					...route,
					params,
					path: routePath
				};
			}
		}
		return null;
	}
	push(url) {
		try {
			let fullUrl = url.startsWith(this.#baseUrl) ? url : this.#baseUrl + (url.startsWith("/") ? url : "/" + url);
			const prevFullUrl = `${window.location.pathname}${window.location.search}`;
			if (prevFullUrl !== fullUrl) window.history.pushState(null, "", fullUrl);
			this.#route = this.#findRoute(fullUrl);
			this.#observer.notify();
		} catch (error) {
			console.error("라우터 네비게이션 오류:", error);
		}
	}
	start() {
		this.#route = this.#findRoute();
		this.#observer.notify();
	}
	static parseQuery = (search = typeof window !== "undefined" ? window.location.search : "") => {
		const params = new URLSearchParams(search);
		const query = {};
		for (const [key, value] of params) query[key] = value;
		return query;
	};
	static stringifyQuery = (query) => {
		const params = new URLSearchParams();
		for (const [key, value] of Object.entries(query)) if (value !== null && value !== void 0 && value !== "") params.set(key, String(value));
		return params.toString();
	};
	static getUrl = (newQuery, baseUrl = "") => {
		const currentQuery = Router.parseQuery();
		const updatedQuery = {
			...currentQuery,
			...newQuery
		};
		Object.keys(updatedQuery).forEach((key) => {
			if (updatedQuery[key] === null || updatedQuery[key] === void 0 || updatedQuery[key] === "") delete updatedQuery[key];
		});
		const queryString = Router.stringifyQuery(updatedQuery);
		const pathname = typeof window !== "undefined" ? window.location.pathname : "/";
		return `${baseUrl}${pathname.replace(baseUrl, "")}${queryString ? `?${queryString}` : ""}`;
	};
};
function ProductCard(product) {
	const { productId, title, image, lprice, brand } = product;
	const price = Number(lprice);
	return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden product-card" 
         data-product-id="${productId}">
      <!-- 상품 이미지 -->
      <div class="aspect-square bg-gray-100 overflow-hidden cursor-pointer product-image">
        <img src="${image}" 
             alt="${title}" 
             class="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
             loading="lazy">
      </div>
      
      <!-- 상품 정보 -->
      <div class="p-3">
        <div class="cursor-pointer product-info mb-3">
          <h3 class="text-sm font-medium text-gray-900 line-clamp-2 mb-1">
            ${title}
          </h3>
          <p class="text-xs text-gray-500 mb-2">${brand}</p>
          <p class="text-lg font-bold text-gray-900">
            ${price.toLocaleString()}원
          </p>
        </div>
        
        <!-- 장바구니 버튼 -->
        <button class="w-full bg-blue-600 text-white text-sm py-2 px-3 rounded-md 
                       hover:bg-blue-700 transition-colors add-to-cart-btn"
                data-product-id="${productId}">
          장바구니 담기
        </button>
      </div>
    </div>
  `;
}
function ProductCardSkeleton() {
	return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      <div class="aspect-square bg-gray-200"></div>
      <div class="p-3">
        <div class="h-4 bg-gray-200 rounded mb-2"></div>
        <div class="h-3 bg-gray-200 rounded w-2/3 mb-2"></div>
        <div class="h-5 bg-gray-200 rounded w-1/2 mb-3"></div>
        <div class="h-8 bg-gray-200 rounded"></div>
      </div>
    </div>
  `;
}
const OPTION_LIMITS = [
	10,
	20,
	50,
	100
];
function SearchBar({ searchQuery = "", limit = 20, sort = "price_asc", category = {}, categories = {} }) {
	const categoryList = Object.keys(categories).length > 0 ? Object.keys(categories) : [];
	const options = OPTION_LIMITS.map((value) => `
        <option value="${value}" ${Number(limit) === value ? "selected" : ""}>
          ${value}개
        </option>
      `).join("");
	const categoryButtons = categoryList.map((categoryKey) => `
        <button 
          data-category1="${categoryKey}"
          class="category1-filter-btn text-left px-3 py-2 text-sm rounded-md border transition-colors
                 bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          ${categoryKey}
        </button>
      `).join("");
	return `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
      <!-- 검색창 -->
      <div class="mb-4">
        <div class="relative">
          <input type="text" 
                 id="search-input"
                 placeholder="상품명을 검색해보세요..." 
                 value="${searchQuery}"
                 class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg 
                        focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
          </div>
        </div>
      </div>
      
      <!-- 필터 옵션 -->
      <div class="space-y-3">
        <!-- 카테고리 필터 -->
        <div class="space-y-2">
          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-600">카테고리:</label>
            ${[
		"전체",
		category.category1,
		category.category2
	].filter((cat, index) => index === 0 || Boolean(cat)).map((cat, index) => {
		if (cat === "전체") return `<button data-breadcrumb="reset" class="text-xs hover:text-blue-800 hover:underline">전체</button>`;
		else if (index === 1) return `<button data-breadcrumb="category1" data-category1="${cat}" class="text-xs hover:text-blue-800 hover:underline">${cat}</button>`;
		else if (index === 2) return `<span class="text-xs text-gray-600 cursor-default">${cat}</span>`;
	}).join("<span class=\"text-xs text-gray-500\">></span>")}
          </div>
          
          <!-- 1depth 카테고리 -->
          ${!category.category1 ? `
            <div class="flex flex-wrap gap-2">
              ${categoryList.length > 0 ? categoryButtons : `<div class="text-sm text-gray-500 italic">카테고리 로딩 중...</div>`}
            </div>
          ` : ""}
          
          <!-- 2depth 카테고리 -->
          ${category.category1 && categories[category.category1] ? `
            <div class="space-y-2">
              <div class="flex flex-wrap gap-2">
                ${Object.keys(categories[category.category1]).map((category2Key) => {
		const isSelected = category.category2 === category2Key;
		return `
                      <button 
                        data-category1="${category.category1}"
                        data-category2="${category2Key}"
                        class="category2-filter-btn text-left px-3 py-2 text-sm rounded-md border transition-colors
                               ${isSelected ? "bg-blue-100 border-blue-300 text-blue-800" : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"}"
                      >
                        ${category2Key}
                      </button>
                    `;
	}).join("")}
              </div>
            </div>
          ` : ""}
        </div>
        
        <!-- 기존 필터들 -->
        <div class="flex gap-2 items-center justify-between">
          <!-- 페이지당 상품 수 -->
          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-600">개수:</label>
            <select id="limit-select" class="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
               ${options}
            </select>
          </div>
          
          <!-- 정렬 -->
          <div class="flex items-center gap-2">
            <label class="text-sm text-gray-600">정렬:</label>
            <select id="sort-select" 
                    class="text-sm border border-gray-300 rounded px-2 py-1 
                           focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
              <option value="price_asc" ${sort === "price_asc" ? "selected" : ""}>가격 낮은순</option>
              <option value="price_desc" ${sort === "price_desc" ? "selected" : ""}>가격 높은순</option>
              <option value="name_asc" ${sort === "name_asc" ? "selected" : ""}>이름순</option>
              <option value="name_desc" ${sort === "name_desc" ? "selected" : ""}>이름 역순</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `;
}
const loadingSkeleton = Array(6).fill(0).map(ProductCardSkeleton).join("");
function ProductList({ products = [], loading = false, error = null, totalCount = 0, hasMore = true }) {
	if (error) return `
      <div class="text-center py-12">
        <div class="text-red-500 mb-4">
          <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">오류가 발생했습니다</h3>
        <p class="text-gray-600 mb-4">${error}</p>
        <button id="retry-btn" 
                class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
          다시 시도
        </button>
      </div>
    `;
	if (!loading && products.length === 0) return `
      <div class="text-center py-12">
        <div class="text-gray-400 mb-4">
          <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">상품을 찾을 수 없습니다</h3>
        <p class="text-gray-600">다른 검색어를 시도해보세요.</p>
      </div>
    `;
	return `
    <div>
      <!-- 상품 개수 정보 -->
      ${totalCount > 0 ? `
        <div class="mb-4 text-sm text-gray-600">
          총 <span class="font-medium text-gray-900">${totalCount.toLocaleString()}개</span>의 상품
        </div>
      ` : ""}
      
      <!-- 상품 그리드 -->
      <div class="grid grid-cols-2 gap-4 mb-6" id="products-grid">
        ${products.map((product) => ProductCard(product)).join("")}
        
        <!-- 로딩 스켈레톤 -->
        ${loading ? loadingSkeleton : ""}
      </div>
      
      <!-- 무한 스크롤 로딩 -->
      ${loading && products.length > 0 ? `
        <div class="text-center py-4">
          <div class="inline-flex items-center">
            <svg class="animate-spin h-5 w-5 text-blue-600 mr-2" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="text-sm text-gray-600">상품을 불러오는 중...</span>
          </div>
        </div>
      ` : ""}
      
      <!-- 더 이상 로드할 상품이 없음 -->
      ${!hasMore && products.length > 0 && !loading ? `
        <div class="text-center py-4 text-sm text-gray-500">
          모든 상품을 확인했습니다
        </div>
      ` : ""}
      
      <!-- 무한 스크롤 트리거 -->
      <div id="scroll-trigger" class="h-4"></div>
    </div>
  `;
}
function CartItem({ id, title, image, price, quantity, selected }) {
	const subtotal = price * quantity;
	return `
    <div class="flex items-center py-3 border-b border-gray-100 cart-item" data-product-id="${id}">
      <label class="flex items-center mr-3">
        <input type="checkbox" 
               ${selected ? "checked" : ""}
               class="cart-item-checkbox w-4 h-4 text-blue-600 border-gray-300 rounded 
                      focus:ring-blue-500"
               data-product-id="${id}">
      </label>
      
      <div class="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden mr-3 flex-shrink-0">
        <img src="${image}" 
             alt="${title}" 
             class="w-full h-full object-cover cursor-pointer cart-item-image"
             data-product-id="${id}">
      </div>
      
      <div class="flex-1 min-w-0">
        <h4 class="text-sm font-medium text-gray-900 truncate cursor-pointer cart-item-title"
            data-product-id="${id}">
          ${title}
        </h4>
        <p class="text-sm text-gray-600 mt-1">
          ${price.toLocaleString()}원
        </p>
        
        <div class="flex items-center mt-2">
          <button class="quantity-decrease-btn w-7 h-7 flex items-center justify-center 
                         border border-gray-300 rounded-l-md bg-gray-50 hover:bg-gray-100"
                  data-product-id="${id}">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
            </svg>
          </button>
          
          <input type="number" 
                 value="${quantity}" 
                 min="1"
                 class="quantity-input w-12 h-7 text-center text-sm border-t border-b 
                        border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                 disabled
                 data-product-id="${id}">
          
          <button class="quantity-increase-btn w-7 h-7 flex items-center justify-center 
                         border border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100"
                  data-product-id="${id}">
            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
          </button>
        </div>
      </div>
      
      <div class="text-right ml-3">
        <p class="text-sm font-medium text-gray-900">
          ${subtotal.toLocaleString()}원
        </p>
        <button class="cart-item-remove-btn mt-1 text-xs text-red-600 hover:text-red-800"
                data-product-id="${id}">
          삭제
        </button>
      </div>
    </div>
  `;
}
function CartModal({ items = [], selectedAll = false, isOpen = false }) {
	if (!isOpen) return "";
	const selectedItems = items.filter((item) => item.selected);
	const selectedCount = selectedItems.length;
	const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
	const selectedAmount = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
	return `
    <div class="fixed inset-0 z-50 overflow-y-auto cart-modal">
      <!-- 배경 오버레이 -->
      <div class="fixed inset-0 bg-black bg-opacity-50 transition-opacity cart-modal-overlay"></div>
      
      <!-- 모달 컨테이너 -->
      <div class="flex min-h-full items-end justify-center p-0 sm:items-center sm:p-4">
        <div class="relative bg-white rounded-t-lg sm:rounded-lg shadow-xl w-full max-w-md sm:max-w-lg max-h-[90vh] overflow-hidden">
          <!-- 헤더 -->
          <div class="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
            <h2 class="text-lg font-bold text-gray-900 flex items-center">
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4m2.6 8L6 2H3m4 11v6a1 1 0 001 1h1a1 1 0 001-1v-6M13 13v6a1 1 0 001 1h1a1 1 0 001-1v-6"/>
              </svg>
              장바구니 
              ${items.length > 0 ? `<span class="text-sm font-normal text-gray-600 ml-1">(${items.length})</span>` : ""}
            </h2>
            
            <button id="cart-modal-close-btn" 
                    class="text-gray-400 hover:text-gray-600 p-1">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
          
          <!-- 컨텐츠 -->
          <div class="flex flex-col max-h-[calc(90vh-120px)]">
            ${items.length === 0 ? `
                <!-- 빈 장바구니 -->
                <div class="flex-1 flex items-center justify-center p-8">
                  <div class="text-center">
                    <div class="text-gray-400 mb-4">
                      <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                              d="M3 3h2l.4 2M7 13h10l4-8H5.4m2.6 8L6 2H3m4 11v6a1 1 0 001 1h1a1 1 0 001-1v-6M13 13v6a1 1 0 001 1h1a1 1 0 001-1v-6"/>
                      </svg>
                    </div>
                    <h3 class="text-lg font-medium text-gray-900 mb-2">장바구니가 비어있습니다</h3>
                    <p class="text-gray-600">원하는 상품을 담아보세요!</p>
                  </div>
                </div>
              ` : `
                <!-- 전체 선택 섹션 -->
                <div class="p-4 border-b border-gray-200 bg-gray-50">
                  <label class="flex items-center text-sm text-gray-700">
                    <input type="checkbox" 
                           id="cart-modal-select-all-checkbox"
                           ${selectedAll ? "checked" : ""}
                           class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-2">
                    전체선택 (${items.length}개)
                  </label>
                </div>
                
                <!-- 아이템 목록 -->
                <div class="flex-1 overflow-y-auto">
                  <div class="p-4 space-y-4">
                    ${items.map((item) => CartItem(item)).join("")}
                  </div>
                </div>
              `}
          </div>
          
          ${items.length > 0 ? `
              <!-- 하단 액션 -->
              <div class="sticky bottom-0 bg-white border-t border-gray-200 p-4">
                <!-- 선택된 아이템 정보 -->
                ${selectedCount > 0 ? `
                  <div class="flex justify-between items-center mb-3 text-sm">
                    <span class="text-gray-600">선택한 상품 (${selectedCount}개)</span>
                    <span class="font-medium">${selectedAmount.toLocaleString()}원</span>
                  </div>
                ` : ""}
                
                <!-- 총 금액 -->
                <div class="flex justify-between items-center mb-4">
                  <span class="text-lg font-bold text-gray-900">총 금액</span>
                  <span class="text-xl font-bold text-blue-600">${totalAmount.toLocaleString()}원</span>
                </div>
                
                <!-- 액션 버튼들 -->
                <div class="space-y-2">
                  ${selectedCount > 0 ? `
                    <button id="cart-modal-remove-selected-btn" 
                            class="w-full bg-red-600 text-white py-2 px-4 rounded-md 
                                   hover:bg-red-700 transition-colors text-sm">
                      선택한 상품 삭제 (${selectedCount}개)
                    </button>
                  ` : ""}
                  
                  <div class="flex gap-2">
                    <button id="cart-modal-clear-cart-btn" 
                            class="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md 
                                   hover:bg-gray-700 transition-colors text-sm">
                      전체 비우기
                    </button>
                    <button id="cart-modal-checkout-btn" 
                            class="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md 
                                   hover:bg-blue-700 transition-colors text-sm">
                      구매하기
                    </button>
                  </div>
                </div>
              </div>
            ` : ""}
        </div>
      </div>
    </div>
  `;
}
function Toast({ isVisible = false, message = "", type = "info" }) {
	if (!isVisible) return "";
	const getIconAndColor = () => {
		switch (type) {
			case "success": return {
				bg: "bg-green-600",
				icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                 </svg>`
			};
			case "error": return {
				bg: "bg-red-600",
				icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                 </svg>`
			};
			case "warning": return {
				bg: "bg-yellow-600",
				icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                 </svg>`
			};
			default: return {
				bg: "bg-blue-600",
				icon: `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                 </svg>`
			};
		}
	};
	const { bg, icon } = getIconAndColor();
	return `
    <div class="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 toast-container">
      <div class="${bg} text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2 max-w-sm">
        <div class="flex-shrink-0">
          ${icon}
        </div>
        <p class="text-sm font-medium">${message}</p>
        <button id="toast-close-btn" 
                class="flex-shrink-0 ml-2 text-white hover:text-gray-200">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
    </div>
  `;
}
function Logo() {
	return `
    <h1 class="text-xl font-bold text-gray-900">
      <a href="/" data-link>쇼핑몰</a>
    </h1>
  `;
}
function Footer() {
	return `
    <footer class="bg-white shadow-sm sticky top-0 z-40">
      <div class="max-w-md mx-auto py-8 text-center text-gray-500">
        <p>&copy; ${(/* @__PURE__ */ new Date()).getFullYear()} 항해플러스 프론트엔드 쇼핑몰</p>
      </div>
    </footer>
  `;
}
const PRODUCT_ACTIONS = {
	SET_PRODUCTS: "products/setProducts",
	ADD_PRODUCTS: "products/addProducts",
	SET_LOADING: "products/setLoading",
	SET_ERROR: "products/setError",
	SET_CATEGORIES: "products/setCategories",
	SET_CURRENT_PRODUCT: "products/setCurrentProduct",
	SET_RELATED_PRODUCTS: "products/setRelatedProducts",
	RESET_FILTERS: "products/resetFilters",
	SETUP: "products/setup",
	SET_STATUS: "products/setStatus"
};
const CART_ACTIONS = {
	ADD_ITEM: "cart/addItem",
	REMOVE_ITEM: "cart/removeItem",
	UPDATE_QUANTITY: "cart/updateQuantity",
	CLEAR_CART: "cart/clearCart",
	TOGGLE_SELECT: "cart/toggleSelect",
	SELECT_ALL: "cart/selectAll",
	DESELECT_ALL: "cart/deselectAll",
	REMOVE_SELECTED: "cart/removeSelected",
	LOAD_FROM_STORAGE: "cart/loadFromStorage",
	SYNC_TO_STORAGE: "cart/syncToStorage"
};
const UI_ACTIONS = {
	OPEN_CART_MODAL: "ui/openCartModal",
	CLOSE_CART_MODAL: "ui/closeCartModal",
	SET_GLOBAL_LOADING: "ui/setGlobalLoading",
	SHOW_TOAST: "ui/showToast",
	HIDE_TOAST: "ui/hideToast"
};
const createStore = (reducer, initialState$2) => {
	const { subscribe, notify } = createObserver();
	let state = initialState$2;
	const getState = () => state;
	const dispatch = (action) => {
		const newState = reducer(state, action);
		if (newState !== state) {
			state = newState;
			notify();
		}
	};
	return {
		getState,
		dispatch,
		subscribe
	};
};
const createStorage = (key, storage = typeof window !== "undefined" ? window.localStorage : null) => {
	const get = () => {
		if (!storage) return null;
		try {
			const item = storage.getItem(key);
			return item ? JSON.parse(item) : null;
		} catch (error) {
			console.error(`Error parsing storage item for key "${key}":`, error);
			return null;
		}
	};
	const set = (value) => {
		if (!storage) return;
		try {
			storage.setItem(key, JSON.stringify(value));
		} catch (error) {
			console.error(`Error setting storage item for key "${key}":`, error);
		}
	};
	const reset = () => {
		if (!storage) return;
		try {
			storage.removeItem(key);
		} catch (error) {
			console.error(`Error removing storage item for key "${key}":`, error);
		}
	};
	return {
		get,
		set,
		reset
	};
};
const initialProductState = {
	products: [],
	totalCount: 0,
	currentProduct: null,
	relatedProducts: [],
	loading: true,
	error: null,
	status: "idle",
	categories: {}
};
const productReducer = (state, action) => {
	switch (action.type) {
		case PRODUCT_ACTIONS.SET_STATUS: return {
			...state,
			status: action.payload
		};
		case PRODUCT_ACTIONS.SET_CATEGORIES: return {
			...state,
			categories: action.payload,
			loading: false,
			error: null,
			status: "done"
		};
		case PRODUCT_ACTIONS.SET_PRODUCTS: return {
			...state,
			products: action.payload.products,
			totalCount: action.payload.totalCount,
			loading: false,
			error: null,
			status: "done"
		};
		case PRODUCT_ACTIONS.ADD_PRODUCTS: return {
			...state,
			products: [...state.products, ...action.payload.products],
			totalCount: action.payload.totalCount,
			loading: false,
			error: null,
			status: "done"
		};
		case PRODUCT_ACTIONS.SET_LOADING: return {
			...state,
			loading: action.payload
		};
		case PRODUCT_ACTIONS.SET_ERROR: return {
			...state,
			error: action.payload,
			loading: false,
			status: "done"
		};
		case PRODUCT_ACTIONS.SET_CURRENT_PRODUCT: return {
			...state,
			currentProduct: action.payload,
			loading: false,
			error: null,
			status: "done"
		};
		case PRODUCT_ACTIONS.SET_RELATED_PRODUCTS: return {
			...state,
			relatedProducts: action.payload,
			status: "done"
		};
		case PRODUCT_ACTIONS.SETUP: return {
			...state,
			...action.payload
		};
		default: return state;
	}
};
const productStore = createStore(productReducer, initialProductState);
const cartStorage = createStorage("shopping_cart");
const initialState$1 = {
	items: [],
	selectedAll: false
};
const findCartItem = (items, productId) => {
	return items.find((item) => item.id === productId);
};
const cartReducer = (_, action) => {
	const state = cartStorage.get() ?? initialState$1;
	switch (action.type) {
		case CART_ACTIONS.ADD_ITEM: {
			const { product, quantity = 1 } = action.payload;
			const existingItem = findCartItem(state.items, product.productId);
			if (existingItem) return {
				...state,
				items: state.items.map((item) => item.id === product.productId ? {
					...item,
					quantity: item.quantity + quantity
				} : item)
			};
			else {
				const newItem = {
					id: product.productId,
					title: product.title,
					image: product.image,
					price: parseInt(product.lprice),
					quantity,
					selected: false
				};
				return {
					...state,
					items: [...state.items, newItem]
				};
			}
		}
		case CART_ACTIONS.REMOVE_ITEM: return {
			...state,
			items: state.items.filter((item) => item.id !== action.payload)
		};
		case CART_ACTIONS.UPDATE_QUANTITY: {
			const { productId, quantity } = action.payload;
			return {
				...state,
				items: state.items.map((item) => item.id === productId ? {
					...item,
					quantity: Math.max(1, quantity)
				} : item)
			};
		}
		case CART_ACTIONS.CLEAR_CART: return {
			...state,
			items: [],
			selectedAll: false
		};
		case CART_ACTIONS.TOGGLE_SELECT: {
			const productId = action.payload;
			const updatedItems = state.items.map((item) => item.id === productId ? {
				...item,
				selected: !item.selected
			} : item);
			const allSelected = updatedItems.length > 0 && updatedItems.every((item) => item.selected);
			return {
				...state,
				items: updatedItems,
				selectedAll: allSelected
			};
		}
		case CART_ACTIONS.SELECT_ALL: {
			const updatedItems = state.items.map((item) => ({
				...item,
				selected: true
			}));
			return {
				...state,
				items: updatedItems,
				selectedAll: true
			};
		}
		case CART_ACTIONS.DESELECT_ALL: {
			const updatedItems = state.items.map((item) => ({
				...item,
				selected: false
			}));
			return {
				...state,
				items: updatedItems,
				selectedAll: false
			};
		}
		case CART_ACTIONS.REMOVE_SELECTED: return {
			...state,
			items: state.items.filter((item) => !item.selected),
			selectedAll: false
		};
		case CART_ACTIONS.LOAD_FROM_STORAGE: return {
			...state,
			...action.payload
		};
		default: return state;
	}
};
const cartStore = createStore(cartReducer, initialState$1);
const initialState = {
	cartModal: { isOpen: false },
	globalLoading: false,
	toast: {
		isVisible: false,
		message: "",
		type: "info"
	}
};
const uiReducer = (state, action) => {
	switch (action.type) {
		case UI_ACTIONS.OPEN_CART_MODAL: return {
			...state,
			cartModal: { isOpen: true }
		};
		case UI_ACTIONS.CLOSE_CART_MODAL: return {
			...state,
			cartModal: { isOpen: false }
		};
		case UI_ACTIONS.HIDE_TOAST: return {
			...state,
			toast: {
				...state.toast,
				isVisible: false
			}
		};
		case UI_ACTIONS.SHOW_TOAST: return {
			...state,
			toast: {
				isVisible: true,
				message: action.payload.message,
				type: action.payload.type || "info"
			}
		};
		default: return state;
	}
};
const uiStore = createStore(uiReducer, initialState);
const BASE_URL = "/front_6th_chapter4-1/vanilla/";
const router = new Router(BASE_URL);
const lifeCycles = /* @__PURE__ */ new WeakMap();
const pageState = {
	current: null,
	previous: null
};
const initLifecycle = {
	mount: null,
	unmount: null,
	watches: [],
	deps: [],
	mounted: false
};
const getPageLifecycle = (page) => {
	if (!lifeCycles.has(page)) lifeCycles.set(page, { ...initLifecycle });
	return lifeCycles.get(page);
};
const depsChanged = (newDeps, oldDeps) => {
	if (!Array.isArray(newDeps) || !Array.isArray(oldDeps)) return false;
	if (newDeps.length !== oldDeps.length) return true;
	return newDeps.some((dep, index) => dep !== oldDeps[index]);
};
const mount = (page) => {
	const lifecycle = getPageLifecycle(page);
	if (lifecycle.mounted) return;
	lifecycle.mount?.();
	lifecycle.mounted = true;
	lifecycle.deps = [];
};
const unmount = (pageFunction) => {
	const lifecycle = getPageLifecycle(pageFunction);
	if (!lifecycle.mounted) return;
	lifecycle.unmount?.();
	lifecycle.mounted = false;
};
const withLifecycle = ({ onMount, onUnmount, watches } = {}, page) => {
	const lifecycle = getPageLifecycle(page);
	if (typeof onMount === "function") lifecycle.mount = onMount;
	if (typeof onUnmount === "function") lifecycle.unmount = onUnmount;
	if (Array.isArray(watches)) lifecycle.watches = typeof watches[0] === "function" ? [watches] : watches;
	return (...args) => {
		if (typeof window === "undefined") return page(...args);
		const wasNewPage = pageState.current !== page;
		if (pageState.current && wasNewPage) unmount(pageState.current);
		pageState.previous = pageState.current;
		pageState.current = page;
		if (wasNewPage) mount(page);
		else if (lifecycle.watches) lifecycle.watches.forEach(([getDeps, callback], index) => {
			const newDeps = getDeps();
			if (depsChanged(newDeps, lifecycle.deps[index])) callback();
			lifecycle.deps[index] = Array.isArray(newDeps) ? [...newDeps] : [];
		});
		return page(...args);
	};
};
async function getProducts(params = {}) {
	const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
	const page = params.current ?? params.page ?? 1;
	const searchParams = new URLSearchParams({
		page: page.toString(),
		limit: limit.toString(),
		...search && { search },
		...category1 && { category1 },
		...category2 && { category2 },
		sort
	});
	const response = await fetch(`/api/products?${searchParams}`);
	return await response.json();
}
async function getProduct(productId) {
	const response = await fetch(`/api/products/${productId}`);
	return await response.json();
}
async function getCategories() {
	const response = await fetch("/api/categories");
	return await response.json();
}
const loadProductsAndCategories = async () => {
	router.query = { current: void 0 };
	productStore.dispatch({
		type: PRODUCT_ACTIONS.SETUP,
		payload: {
			...initialProductState,
			loading: true,
			status: "pending"
		}
	});
	try {
		const [{ products, pagination: { total } }, categories] = await Promise.all([getProducts(router.query), getCategories()]);
		productStore.dispatch({
			type: PRODUCT_ACTIONS.SETUP,
			payload: {
				products,
				categories,
				totalCount: total,
				loading: false,
				status: "done"
			}
		});
	} catch (error) {
		productStore.dispatch({
			type: PRODUCT_ACTIONS.SET_ERROR,
			payload: error.message
		});
		throw error;
	}
};
const loadProducts = async (resetList = true) => {
	try {
		productStore.dispatch({
			type: PRODUCT_ACTIONS.SETUP,
			payload: {
				loading: true,
				status: "pending",
				error: null
			}
		});
		const { products, pagination: { total } } = await getProducts(router.query);
		const payload = {
			products,
			totalCount: total
		};
		if (resetList) {
			productStore.dispatch({
				type: PRODUCT_ACTIONS.SET_PRODUCTS,
				payload
			});
			return;
		}
		productStore.dispatch({
			type: PRODUCT_ACTIONS.ADD_PRODUCTS,
			payload
		});
	} catch (error) {
		productStore.dispatch({
			type: PRODUCT_ACTIONS.SET_ERROR,
			payload: error.message
		});
		throw error;
	}
};
const loadProductDetailForPage = async (productId) => {
	try {
		const currentProduct = productStore.getState().currentProduct;
		if (productId === currentProduct?.productId) {
			if (currentProduct.category2) await loadRelatedProducts(currentProduct.category2, productId);
			return;
		}
		productStore.dispatch({
			type: PRODUCT_ACTIONS.SETUP,
			payload: {
				...initialProductState,
				currentProduct: null,
				loading: true,
				status: "pending"
			}
		});
		const product = await getProduct(productId);
		productStore.dispatch({
			type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
			payload: product
		});
		if (product.category2) await loadRelatedProducts(product.category2, productId);
	} catch (error) {
		console.error("상품 상세 페이지 로드 실패:", error);
		productStore.dispatch({
			type: PRODUCT_ACTIONS.SET_ERROR,
			payload: error.message
		});
		throw error;
	}
};
const loadRelatedProducts = async (category2, excludeProductId) => {
	try {
		const params = {
			category2,
			limit: 20,
			page: 1
		};
		const response = await getProducts(params);
		const relatedProducts = response.products.filter((product) => product.productId !== excludeProductId);
		productStore.dispatch({
			type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
			payload: relatedProducts
		});
	} catch (error) {
		console.error("관련 상품 로드 실패:", error);
		productStore.dispatch({
			type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
			payload: []
		});
	}
};
const PageWrapper = ({ headerLeft, children }) => {
	const cart = cartStore.getState();
	const { cartModal, toast } = uiStore.getState();
	const cartSize = cart.items.length;
	const cartCount = `
    <span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
      ${cartSize > 99 ? "99+" : cartSize}
    </span>
  `;
	return `
    <div class="min-h-screen bg-gray-50">
      <header class="bg-white shadow-sm sticky top-0 z-40">
        <div class="max-w-md mx-auto px-4 py-4">
          <div class="flex items-center justify-between">
            ${headerLeft}
            <div class="flex items-center space-x-2">
              <!-- 장바구니 아이콘 -->
              <button id="cart-icon-btn" class="relative p-2 text-gray-700 hover:text-gray-900 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4m2.6 8L6 2H3m4 11v6a1 1 0 001 1h1a1 1 0 001-1v-6M13 13v6a1 1 0 001 1h1a1 1 0 001-1v-6"/>
                </svg>
                ${cartSize > 0 ? cartCount : ""}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main class="max-w-md mx-auto px-4 py-4">
        ${children}
      </main>
      
      ${CartModal({
		...cart,
		isOpen: cartModal.isOpen
	})}
      
      ${Toast(toast)}
      
      ${Footer()}
    </div>
  `;
};
const HomePage = withLifecycle({
	onMount: () => {
		const currentState = productStore.getState();
		console.log("🏠 HomePage onMount:", {
			productsLength: currentState.products.length,
			status: currentState.status
		});
		if (currentState.products.length === 0 || currentState.status !== "done") {
			console.log("📡 새로운 데이터 로드 시작");
			loadProductsAndCategories();
		} else console.log("✅ 서버 데이터 재사용");
	},
	watches: [() => {
		const { search, limit, sort, category1, category2 } = router.query;
		return [
			search,
			limit,
			sort,
			category1,
			category2
		];
	}, () => loadProducts(true)]
}, () => {
	const productState = productStore.getState();
	const currentRouter = typeof window === "undefined" ? global.router : router;
	const { search: searchQuery = "", limit = "10", sort = "recent", category1 = "", category2 = "" } = currentRouter?.query || {};
	const { products = [], loading = false, error = null, totalCount = 0, categories = [] } = productState;
	const category = {
		category1,
		category2
	};
	const hasMore = products.length < totalCount;
	return PageWrapper({
		headerLeft: `
        <h1 class="text-xl font-bold text-gray-900">
          <a href="/" data-link>쇼핑몰</a>
        </h1>
      `.trim(),
		children: `
        <!-- 검색 및 필터 -->
        ${SearchBar({
			searchQuery,
			limit,
			sort,
			category,
			categories
		})}
        
        <!-- 상품 목록 -->
        <div class="mb-6">
          ${ProductList({
			products,
			loading,
			error,
			totalCount,
			hasMore
		})}
        </div>
      `.trim()
	});
});
const loadingContent = `
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p class="text-gray-600">상품 정보를 불러오는 중...</p>
    </div>
  </div>
`;
const ErrorContent = ({ error }) => `
  <div class="min-h-screen bg-gray-50 flex items-center justify-center">
    <div class="text-center">
      <div class="text-red-500 mb-4">
        <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/>
        </svg>
      </div>
      <h1 class="text-xl font-bold text-gray-900 mb-2">상품을 찾을 수 없습니다</h1>
      <p class="text-gray-600 mb-4">${error || "요청하신 상품이 존재하지 않습니다."}</p>
      <button onclick="window.history.back()" 
              class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 mr-2">
        이전 페이지
      </button>
      <a href="/" data-link class="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700">
        홈으로
      </a>
    </div>
  </div>
`;
function ProductDetail({ product, relatedProducts = [] }) {
	const { productId, title, image, lprice, brand, description = "", rating = 0, reviewCount = 0, stock = 100, category1, category2 } = product;
	const price = Number(lprice);
	const breadcrumbItems = [];
	if (category1) breadcrumbItems.push({
		name: category1,
		category: "category1",
		value: category1
	});
	if (category2) breadcrumbItems.push({
		name: category2,
		category: "category2",
		value: category2
	});
	return `
    <!-- 브레드크럼 -->
    ${breadcrumbItems.length > 0 ? `
      <nav class="mb-4">
        <div class="flex items-center space-x-2 text-sm text-gray-600">
          <a href="/" data-link class="hover:text-blue-600 transition-colors">홈</a>
          ${breadcrumbItems.map((item) => `
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
            <button class="breadcrumb-link" data-${item.category}="${item.value}">
              ${item.name}
            </button>
          `).join("")}
        </div>
      </nav>
    ` : ""}

    <!-- 상품 상세 정보 -->
    <div class="bg-white rounded-lg shadow-sm mb-6">
      <!-- 상품 이미지 -->
      <div class="p-4">
        <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
          <img src="${image}" 
               alt="${title}" 
               class="w-full h-full object-cover product-detail-image">
        </div>
        
        <!-- 상품 정보 -->
        <div>
          <p class="text-sm text-gray-600 mb-1">${brand}</p>
          <h1 class="text-xl font-bold text-gray-900 mb-3">${title}</h1>
          
          <!-- 평점 및 리뷰 -->
          ${rating > 0 ? `
            <div class="flex items-center mb-3">
              <div class="flex items-center">
                ${Array(5).fill(0).map((_, i) => `
                  <svg class="w-4 h-4 ${i < rating ? "text-yellow-400" : "text-gray-300"}" 
                       fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                `).join("")}
              </div>
              <span class="ml-2 text-sm text-gray-600">${rating}.0 (${reviewCount.toLocaleString()}개 리뷰)</span>
            </div>
          ` : ""}
          
          <!-- 가격 -->
          <div class="mb-4">
            <span class="text-2xl font-bold text-blue-600">${price.toLocaleString()}원</span>
          </div>
          
          <!-- 재고 -->
          <div class="text-sm text-gray-600 mb-4">
            재고 ${stock.toLocaleString()}개
          </div>
          
          <!-- 설명 -->
          ${description ? `
            <div class="text-sm text-gray-700 leading-relaxed mb-6">
              ${description}
            </div>
          ` : ""}
        </div>
      </div>
      
      <!-- 수량 선택 및 액션 -->
      <div class="border-t border-gray-200 p-4">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm font-medium text-gray-900">수량</span>
          <div class="flex items-center">
            <button id="quantity-decrease" 
                    class="w-8 h-8 flex items-center justify-center border border-gray-300 
                           rounded-l-md bg-gray-50 hover:bg-gray-100">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4"/>
              </svg>
            </button>
            
            <input type="number" 
                   id="quantity-input"
                   value="1" 
                   min="1" 
                   max="${stock}"
                   class="w-16 h-8 text-center text-sm border-t border-b border-gray-300 
                          focus:ring-1 focus:ring-blue-500 focus:border-blue-500">
            
            <button id="quantity-increase" 
                    class="w-8 h-8 flex items-center justify-center border border-gray-300 
                           rounded-r-md bg-gray-50 hover:bg-gray-100">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
            </button>
          </div>
        </div>
        
        <!-- 액션 버튼 -->
        <button id="add-to-cart-btn" 
                data-product-id="${productId}"
                class="w-full bg-blue-600 text-white py-3 px-4 rounded-md 
                       hover:bg-blue-700 transition-colors font-medium">
          장바구니 담기
        </button>
      </div>
    </div>

    <!-- 상품 목록으로 이동 -->
    <div class="mb-6">
      <button class="block w-full text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-md 
                hover:bg-gray-200 transition-colors go-to-product-list">
        상품 목록으로 돌아가기
      </button>
    </div>

    <!-- 관련 상품 -->
    ${relatedProducts.length > 0 ? `
      <div class="bg-white rounded-lg shadow-sm">
        <div class="p-4 border-b border-gray-200">
          <h2 class="text-lg font-bold text-gray-900">관련 상품</h2>
          <p class="text-sm text-gray-600">같은 카테고리의 다른 상품들</p>
        </div>
        <div class="p-4">
          <div class="grid grid-cols-2 gap-3 responsive-grid">
            ${relatedProducts.slice(0, 20).map((relatedProduct) => `
              <div class="bg-gray-50 rounded-lg p-3 related-product-card cursor-pointer"
                   data-product-id="${relatedProduct.productId}">
                <div class="aspect-square bg-white rounded-md overflow-hidden mb-2">
                  <img src="${relatedProduct.image}" 
                       alt="${relatedProduct.title}" 
                       class="w-full h-full object-cover"
                       loading="lazy">
                </div>
                <h3 class="text-sm font-medium text-gray-900 mb-1 line-clamp-2">${relatedProduct.title}</h3>
                <p class="text-sm font-bold text-blue-600">${Number(relatedProduct.lprice).toLocaleString()}원</p>
              </div>
            `).join("")}
          </div>
        </div>
      </div>
    ` : ""}
  `;
}
const ProductDetailPage = withLifecycle({
	onMount: () => {
		const currentRouter = typeof window === "undefined" ? global.router : router;
		const currentState = productStore.getState();
		const isSameProduct = currentState.currentProduct?.productId === currentRouter.params.id;
		if (!isSameProduct || !currentState.currentProduct) loadProductDetailForPage(currentRouter.params.id);
	},
	watches: [() => {
		const currentRouter = typeof window === "undefined" ? global.router : router;
		return [currentRouter.params.id];
	}, () => {
		const currentRouter = typeof window === "undefined" ? global.router : router;
		loadProductDetailForPage(currentRouter.params.id);
	}]
}, () => {
	const { currentProduct: product = null, relatedProducts = [], error = null, loading = false } = productStore.getState();
	return PageWrapper({
		headerLeft: `
        <div class="flex items-center space-x-3">
          <button onclick="window.history.back()" 
                  class="p-2 text-gray-700 hover:text-gray-900 transition-colors">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>
          <h1 class="text-lg font-bold text-gray-900">상품 상세</h1>
        </div>
      `.trim(),
		children: loading ? loadingContent : error && !product ? ErrorContent({ error }) : product ? ProductDetail({
			product,
			relatedProducts
		}) : ErrorContent({ error: "상품을 불러올 수 없습니다." })
	});
});
const NotFoundPage = () => PageWrapper({
	headerLeft: Logo(),
	children: `
      <div class="text-center my-4 py-20 shadow-md p-6 bg-white rounded-lg">
        <svg viewBox="0 0 320 180" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#4285f4;stop-opacity:1" />
              <stop offset="100%" style="stop-color:#1a73e8;stop-opacity:1" />
            </linearGradient>
            <filter id="softShadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="8" flood-color="#000000" flood-opacity="0.1"/>
            </filter>
          </defs>
          
          <!-- 404 Numbers -->
          <text x="160" y="85" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="48" font-weight="600" fill="url(#blueGradient)" text-anchor="middle">404</text>
          
          <!-- Icon decoration -->
          <circle cx="80" cy="60" r="3" fill="#e8f0fe" opacity="0.8"/>
          <circle cx="240" cy="60" r="3" fill="#e8f0fe" opacity="0.8"/>
          <circle cx="90" cy="45" r="2" fill="#4285f4" opacity="0.5"/>
          <circle cx="230" cy="45" r="2" fill="#4285f4" opacity="0.5"/>
          
          <!-- Message -->
          <text x="160" y="110" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="14" font-weight="400" fill="#5f6368" text-anchor="middle">페이지를 찾을 수 없습니다</text>
          
          <!-- Subtle bottom accent -->
          <rect x="130" y="130" width="60" height="2" rx="1" fill="url(#blueGradient)" opacity="0.3"/>
        </svg>
        
        <a href="/" data-link class="inline-block px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">홈으로</a>
      </div>
    `.trim()
});
var items_default = /* @__PURE__ */ JSON.parse("[{\"title\":\"방충망 미세먼지 롤 창문 모기장 DIY 100cmx10cm\",\"link\":\"https://smartstore.naver.com/main/products/668979777\",\"image\":\"https://shopping-phinf.pstatic.net/main_1112415/11124150101.10.jpg\",\"lprice\":\"450\",\"hprice\":\"\",\"mallName\":\"동백물산\",\"productId\":\"11124150101\",\"productType\":\"2\",\"brand\":\"메쉬코리아\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"모기장\"},{\"title\":\"일체형 자석 방충망 현관 베란다 창문 안방 모기장 베이직 90X210\",\"link\":\"https://smartstore.naver.com/main/products/2788117408\",\"image\":\"https://shopping-phinf.pstatic.net/main_8028586/80285861246.19.jpg\",\"lprice\":\"9900\",\"hprice\":\"\",\"mallName\":\"다샵\",\"productId\":\"80285861246\",\"productType\":\"2\",\"brand\":\"다샵\",\"maker\":\"다샵\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"모기장\"},{\"title\":\"고농축 알칼리세탁세제 3L 4개 빨래 찌든때 수건 쉰내 냄새제거 실내건조 일반드럼용\",\"link\":\"https://smartstore.naver.com/main/products/6638551514\",\"image\":\"https://shopping-phinf.pstatic.net/main_8418305/84183051836.2.jpg\",\"lprice\":\"20900\",\"hprice\":\"\",\"mallName\":\"기웅생활건강\",\"productId\":\"84183051836\",\"productType\":\"2\",\"brand\":\"쥬블릭\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"세제/세정제\",\"category4\":\"세탁세제\"},{\"title\":\"원캠 스마트 무선 현관 CCTV 실시간 가정용 홈캠 홈 스마트폰 현관문 카메라\",\"link\":\"https://smartstore.naver.com/main/products/5258986017\",\"image\":\"https://shopping-phinf.pstatic.net/main_8280350/82803508510.4.jpg\",\"lprice\":\"98000\",\"hprice\":\"\",\"mallName\":\"원캠\",\"productId\":\"82803508510\",\"productType\":\"2\",\"brand\":\"원캠\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"보안용품\",\"category4\":\"CCTV\"},{\"title\":\"리빙위키 현관 방충망 롤방충망 자동 현관문 출입문 방충문 모기장 일반형 셀프교체시공 무재단\",\"link\":\"https://smartstore.naver.com/main/products/290112144\",\"image\":\"https://shopping-phinf.pstatic.net/main_8440812/8440812714.4.jpg\",\"lprice\":\"51900\",\"hprice\":\"\",\"mallName\":\"리빙홈데코\",\"productId\":\"8440812714\",\"productType\":\"2\",\"brand\":\"리빙홈데코\",\"maker\":\"리빙홈데코\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"모기장\"},{\"title\":\"미세방충망 자석식 기능성 현관 모기장 현관문 방충문 블랙 일반망 시즌1 90x210cm\",\"link\":\"https://smartstore.naver.com/main/products/6711324501\",\"image\":\"https://shopping-phinf.pstatic.net/main_8425582/84255824823.3.jpg\",\"lprice\":\"15900\",\"hprice\":\"\",\"mallName\":\"폴라도레\",\"productId\":\"84255824823\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"모기장\"},{\"title\":\"넓고 튼튼한 원터치 모기장 텐트 사각 침대 아기 슈퍼싱글 SS\",\"link\":\"https://smartstore.naver.com/main/products/8436263806\",\"image\":\"https://shopping-phinf.pstatic.net/main_8598076/85980764129.3.jpg\",\"lprice\":\"29900\",\"hprice\":\"\",\"mallName\":\"베베데코\",\"productId\":\"85980764129\",\"productType\":\"2\",\"brand\":\"베베데코\",\"maker\":\"베베데코\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"모기장\"},{\"title\":\"금동이 1인용 침대모기장 천 원터치모기장 텐트 방충망 접이식 슈퍼싱글화이트\",\"link\":\"https://smartstore.naver.com/main/products/134970527\",\"image\":\"https://shopping-phinf.pstatic.net/main_6858338/6858338014.12.jpg\",\"lprice\":\"13800\",\"hprice\":\"\",\"mallName\":\"금동이샵\",\"productId\":\"6858338014\",\"productType\":\"2\",\"brand\":\"금동이\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"모기장\"},{\"title\":\"코디 순수 3겹 데코 화장지 30롤 30m 두루마리 휴지 물에잘녹는 비데\",\"link\":\"https://smartstore.naver.com/main/products/5597975808\",\"image\":\"https://shopping-phinf.pstatic.net/main_8314247/83142472148.5.jpg\",\"lprice\":\"7690\",\"hprice\":\"\",\"mallName\":\"티에스shop\",\"productId\":\"83142472148\",\"productType\":\"2\",\"brand\":\"CODI\",\"maker\":\"쌍용씨앤비\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"화장지\",\"category4\":\"롤화장지\"},{\"title\":\"물먹는하마 옷장용 /피죤 숯 습기제로 /제습제 /습기제거제\",\"link\":\"https://www.11st.co.kr/connect/Gateway.tmall?method=Xsite&prdNo=56193030&tid=1000000061\",\"image\":\"https://shopping-phinf.pstatic.net/main_8626618/8626618755.4.jpg\",\"lprice\":\"11510\",\"hprice\":\"\",\"mallName\":\"11번가\",\"productId\":\"8626618755\",\"productType\":\"2\",\"brand\":\"물먹는하마\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"제습/방향/탈취\",\"category4\":\"제습제\"},{\"title\":\"생활공작소 대용량제습제 옷장제습제 화장실제습제 24개\",\"link\":\"https://smartstore.naver.com/main/products/4905164407\",\"image\":\"https://shopping-phinf.pstatic.net/main_8244968/82449688071.14.jpg\",\"lprice\":\"20900\",\"hprice\":\"\",\"mallName\":\"주식회사 생활공작소\",\"productId\":\"82449688071\",\"productType\":\"2\",\"brand\":\"생활공작소\",\"maker\":\"SGC\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"제습/방향/탈취\",\"category4\":\"제습제\"},{\"title\":\"큐폴드 접이식카트 폴딩박스 세트 기본형 장바구니캐리어 4바퀴 핸드 쇼핑\",\"link\":\"https://smartstore.naver.com/main/products/5789875556\",\"image\":\"https://shopping-phinf.pstatic.net/main_8333437/83334374970.5.jpg\",\"lprice\":\"69900\",\"hprice\":\"\",\"mallName\":\"큐폴드 QFOLD\",\"productId\":\"83334374970\",\"productType\":\"2\",\"brand\":\"큐폴드\",\"maker\":\"파인드프로덕츠\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"핸드카트\"},{\"title\":\"깨끗한나라 순수프리미엄 화장지 30롤 3겹 33m 두루마리 휴지 물에잘녹는 무형광\",\"link\":\"https://smartstore.naver.com/main/products/5154348621\",\"image\":\"https://shopping-phinf.pstatic.net/main_8269886/82698869544.10.jpg\",\"lprice\":\"12380\",\"hprice\":\"\",\"mallName\":\"티에스shop\",\"productId\":\"82698869544\",\"productType\":\"2\",\"brand\":\"깨끗한나라\",\"maker\":\"깨끗한나라\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"화장지\",\"category4\":\"롤화장지\"},{\"title\":\"클라씨 굿바이 모기장 1인용 원터치 대형 텐트 침대 1인 싱글 슈퍼싱글\",\"link\":\"https://smartstore.naver.com/main/products/5577999749\",\"image\":\"https://shopping-phinf.pstatic.net/main_8312249/83122495821.2.jpg\",\"lprice\":\"21900\",\"hprice\":\"\",\"mallName\":\"클라씨\",\"productId\":\"83122495821\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"모기장\"},{\"title\":\"헤이홈 홈카메라 PRO 스마트 홈캠 펫캠 가정용 cctv 아기 강아지 베이비캠\",\"link\":\"https://smartstore.naver.com/main/products/4947669459\",\"image\":\"https://shopping-phinf.pstatic.net/main_8249218/82492189459.82.jpg\",\"lprice\":\"59900\",\"hprice\":\"\",\"mallName\":\"에디트홈\",\"productId\":\"82492189459\",\"productType\":\"2\",\"brand\":\"헤이홈\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"보안용품\",\"category4\":\"CCTV\"},{\"title\":\"크리넥스 데코앤소프트 3겹 화장지 30롤 2팩 두루마리휴지 물에잘녹는 무형광 집들이 수딩플러스\",\"link\":\"https://smartstore.naver.com/main/products/10609054397\",\"image\":\"https://shopping-phinf.pstatic.net/main_8815355/88153559987.5.jpg\",\"lprice\":\"29900\",\"hprice\":\"\",\"mallName\":\"티에스shop\",\"productId\":\"88153559987\",\"productType\":\"2\",\"brand\":\"크리넥스\",\"maker\":\"유한킴벌리\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"화장지\",\"category4\":\"롤화장지\"},{\"title\":\"스탠리 텀블러 887ml 퀜처 H2.0 플로우스테이트 대용량 손잡이 빨대 텀블러\",\"link\":\"https://smartstore.naver.com/main/products/9662667559\",\"image\":\"https://shopping-phinf.pstatic.net/main_8720716/87207169829.5.jpg\",\"lprice\":\"51900\",\"hprice\":\"\",\"mallName\":\"치포마켓\",\"productId\":\"87207169829\",\"productType\":\"2\",\"brand\":\"스탠리\",\"maker\":\"스탠리\",\"category1\":\"생활/건강\",\"category2\":\"주방용품\",\"category3\":\"잔/컵\",\"category4\":\"텀블러\"},{\"title\":\"BAS 바스 탈취제 핑크 160g ( 방 실내 화장실 냄새제거제 )\",\"link\":\"https://smartstore.naver.com/main/products/11135755263\",\"image\":\"https://shopping-phinf.pstatic.net/main_8868026/88680265585.5.jpg\",\"lprice\":\"15800\",\"hprice\":\"\",\"mallName\":\"BAS 공식 스토어\",\"productId\":\"88680265585\",\"productType\":\"2\",\"brand\":\"BAS\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"제습/방향/탈취\",\"category4\":\"실내탈취제\"},{\"title\":\"살림백서 제습제 습기제거제 520ml 24개 옷장 화장실 선반 염화칼슘\",\"link\":\"https://smartstore.naver.com/main/products/4439990594\",\"image\":\"https://shopping-phinf.pstatic.net/main_8198451/81984513302.11.jpg\",\"lprice\":\"19900\",\"hprice\":\"\",\"mallName\":\"살림백서\",\"productId\":\"81984513302\",\"productType\":\"2\",\"brand\":\"살림백서\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"제습/방향/탈취\",\"category4\":\"제습제\"},{\"title\":\"에코버 식기세척기세제 뉴올인원 20g x 22개입, 2개\",\"link\":\"https://search.shopping.naver.com/catalog/52271232632\",\"image\":\"https://shopping-phinf.pstatic.net/main_5227123/52271232632.20250103175308.jpg\",\"lprice\":\"19800\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"52271232632\",\"productType\":\"1\",\"brand\":\"에코버\",\"maker\":\"에코버\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"세제/세정제\",\"category4\":\"식기세척기전용세제\"},{\"title\":\"더티린넨 탈취제 화장실 담배 집안 실내 홀애비 남자 방 냄새 제거\",\"link\":\"https://smartstore.naver.com/main/products/10103216163\",\"image\":\"https://shopping-phinf.pstatic.net/main_8764771/87647718933.6.jpg\",\"lprice\":\"19300\",\"hprice\":\"\",\"mallName\":\"더티린넨\",\"productId\":\"87647718933\",\"productType\":\"2\",\"brand\":\"더티린넨\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"제습/방향/탈취\",\"category4\":\"실내탈취제\"},{\"title\":\"풍지판 창문 틈새막이 샷시 바람막이 창틀 벌레차단 외풍차단\",\"link\":\"https://smartstore.naver.com/main/products/261719599\",\"image\":\"https://shopping-phinf.pstatic.net/main_8131970/8131970722.30.jpg\",\"lprice\":\"1690\",\"hprice\":\"\",\"mallName\":\"리빙포유\",\"productId\":\"8131970722\",\"productType\":\"2\",\"brand\":\"리빙포유\",\"maker\":\"세일인터내셔널\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"문풍지\"},{\"title\":\"로티 로티홈시스 네모 프리미엄 쇼핑 접이식 카트 L(대형), 그린\",\"link\":\"https://search.shopping.naver.com/catalog/53787418966\",\"image\":\"https://shopping-phinf.pstatic.net/main_5378741/53787418966.20250328134126.jpg\",\"lprice\":\"34400\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53787418966\",\"productType\":\"1\",\"brand\":\"로티홈시스\",\"maker\":\"로티\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"핸드카트\"},{\"title\":\"범일금고 OARC 스마트 금고\",\"link\":\"https://search.shopping.naver.com/catalog/39892144618\",\"image\":\"https://shopping-phinf.pstatic.net/main_3989214/39892144618.20240703161839.jpg\",\"lprice\":\"496290\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"39892144618\",\"productType\":\"1\",\"brand\":\"범일금고\",\"maker\":\"범일금고\",\"category1\":\"생활/건강\",\"category2\":\"문구/사무용품\",\"category3\":\"사무기기\",\"category4\":\"금고\"},{\"title\":\"디오 원터치 모기장 텐트 침대 대형 바닥겸용 화이트 1인용\",\"link\":\"https://smartstore.naver.com/main/products/381096764\",\"image\":\"https://shopping-phinf.pstatic.net/main_1401625/14016258981.7.jpg\",\"lprice\":\"12900\",\"hprice\":\"\",\"mallName\":\"디오컴퍼니\",\"productId\":\"14016258981\",\"productType\":\"2\",\"brand\":\"디오침구\",\"maker\":\"디오컴퍼니\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"모기장\"},{\"title\":\"쌍용씨앤비 CODI 순수한 데코 3겹 30m 30롤, 30롤, 3팩\",\"link\":\"https://search.shopping.naver.com/catalog/52187341621\",\"image\":\"https://shopping-phinf.pstatic.net/main_5218734/52187341621.20250425091125.jpg\",\"lprice\":\"23400\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"52187341621\",\"productType\":\"1\",\"brand\":\"CODI\",\"maker\":\"쌍용씨앤비\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"화장지\",\"category4\":\"롤화장지\"},{\"title\":\"홈매트 리퀴드 코드형+리필 45일 액체 액상 전자 모기향 모기약 훈증기\",\"link\":\"https://smartstore.naver.com/main/products/5395877516\",\"image\":\"https://shopping-phinf.pstatic.net/main_8294037/82940371042.9.jpg\",\"lprice\":\"9980\",\"hprice\":\"\",\"mallName\":\"해브어굿팜\",\"productId\":\"82940371042\",\"productType\":\"2\",\"brand\":\"홈매트\",\"maker\":\"헨켈\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"해충퇴치용품\",\"category4\":\"리퀴드\"},{\"title\":\"홈키파 홈매트 리퀴드 훈증기2 리필4 무향 제로 맥스 코스트코 전자 모기향\",\"link\":\"https://smartstore.naver.com/main/products/10227792455\",\"image\":\"https://shopping-phinf.pstatic.net/main_8777229/87772296006.jpg\",\"lprice\":\"21970\",\"hprice\":\"\",\"mallName\":\"코스트유\",\"productId\":\"87772296006\",\"productType\":\"2\",\"brand\":\"홈매트\",\"maker\":\"헨켈\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"해충퇴치용품\",\"category4\":\"리퀴드\"},{\"title\":\"생활공작소 실리카겔제습제 옷장제습제 서랍제습제 20개\",\"link\":\"https://smartstore.naver.com/main/products/4573567912\",\"image\":\"https://shopping-phinf.pstatic.net/main_8211808/82118088066.9.jpg\",\"lprice\":\"11500\",\"hprice\":\"\",\"mallName\":\"주식회사 생활공작소\",\"productId\":\"82118088066\",\"productType\":\"2\",\"brand\":\"생활공작소\",\"maker\":\"올덴\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"제습/방향/탈취\",\"category4\":\"제습제\"},{\"title\":\"넬리 알칼리 드럼세탁기세제 가루 코스트코 100회+세탁망 땀냄새 빨래쉰내제거 탄산소다\",\"link\":\"https://smartstore.naver.com/main/products/5250558586\",\"image\":\"https://shopping-phinf.pstatic.net/main_8279508/82795081064.24.jpg\",\"lprice\":\"22900\",\"hprice\":\"\",\"mallName\":\"설아네마켓\",\"productId\":\"82795081064\",\"productType\":\"2\",\"brand\":\"NELLIE'S\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"세제/세정제\",\"category4\":\"세탁세제\"},{\"title\":\"블루워시 캡슐 세탁세제 30개입, 시그니처코튼, 1개\",\"link\":\"https://search.shopping.naver.com/catalog/53370594688\",\"image\":\"https://shopping-phinf.pstatic.net/main_5337059/53370594688.20250305111654.jpg\",\"lprice\":\"18900\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53370594688\",\"productType\":\"1\",\"brand\":\"블루워시\",\"maker\":\"블루워시\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"세제/세정제\",\"category4\":\"세탁세제\"},{\"title\":\"날파리 퇴치 초파리 트랩 뿌리파리 벌레 파리 벼룩파리 끈끈이 플라이스틱\",\"link\":\"https://smartstore.naver.com/main/products/6792117787\",\"image\":\"https://shopping-phinf.pstatic.net/main_8433661/84336618109.2.jpg\",\"lprice\":\"2700\",\"hprice\":\"\",\"mallName\":\"메디데이\",\"productId\":\"84336618109\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"해충퇴치용품\",\"category4\":\"끈끈이\"},{\"title\":\"이븐도우 생귄 베톰 명품 차량용 방향제\",\"link\":\"https://search.shopping.naver.com/catalog/45917416618\",\"image\":\"https://shopping-phinf.pstatic.net/main_4591741/45917416618.20250619163618.jpg\",\"lprice\":\"28600\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"45917416618\",\"productType\":\"1\",\"brand\":\"생귄\",\"maker\":\"이븐도우\",\"category1\":\"생활/건강\",\"category2\":\"자동차용품\",\"category3\":\"공기청정용품\",\"category4\":\"차량용방향제\"},{\"title\":\"5차 실외 CCTV IP카메라 외부 감시카메라 방범용 매장 농막 CCTV 무선 와이파이\",\"link\":\"https://smartstore.naver.com/main/products/5892853018\",\"image\":\"https://shopping-phinf.pstatic.net/main_8343735/83437352480.14.jpg\",\"lprice\":\"79000\",\"hprice\":\"\",\"mallName\":\"MOESO\",\"productId\":\"83437352480\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"보안용품\",\"category4\":\"CCTV\"},{\"title\":\"오캠 현관CCTV IP카메라 무선CCTV 가정용 홈CCTV 방범용\",\"link\":\"https://smartstore.naver.com/main/products/9769573610\",\"image\":\"https://shopping-phinf.pstatic.net/main_8731407/87314075883.6.jpg\",\"lprice\":\"89000\",\"hprice\":\"\",\"mallName\":\"오캠시시티비와이파이집문앞캠\",\"productId\":\"87314075883\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"보안용품\",\"category4\":\"CCTV\"},{\"title\":\"탈부착 방충망 자석쫄대 방풍비닐 창문방충망 셀프시공 DIY 백색 100cm\",\"link\":\"https://smartstore.naver.com/main/products/2042376373\",\"image\":\"https://shopping-phinf.pstatic.net/main_1179488/11794889307.3.jpg\",\"lprice\":\"2190\",\"hprice\":\"\",\"mallName\":\"한반도철망\",\"productId\":\"11794889307\",\"productType\":\"2\",\"brand\":\"한반도철망\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"모기장\"},{\"title\":\"초소형 카메라 가정용 소형 무선 CCTV 적외선 홈캠 펫캠\",\"link\":\"https://smartstore.naver.com/main/products/8230148800\",\"image\":\"https://shopping-phinf.pstatic.net/main_8577464/85774649123.3.jpg\",\"lprice\":\"39800\",\"hprice\":\"\",\"mallName\":\"일레닉\",\"productId\":\"85774649123\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"보안용품\",\"category4\":\"CCTV\"},{\"title\":\"마이키파 제로 이카리딘 20% 천연 임산부 뿌리는 모기기피제 기내반입 모기약 모기퇴치제\",\"link\":\"https://smartstore.naver.com/main/products/4891750057\",\"image\":\"https://shopping-phinf.pstatic.net/main_8243627/82436273591.10.jpg\",\"lprice\":\"7980\",\"hprice\":\"\",\"mallName\":\"컬러포\",\"productId\":\"82436273591\",\"productType\":\"2\",\"brand\":\"홈키파\",\"maker\":\"헨켈\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"해충퇴치용품\",\"category4\":\"에어졸/스프레이\"},{\"title\":\"삼정물산 왕타 백선생 베이직 칫솔 10개입, 1개\",\"link\":\"https://search.shopping.naver.com/catalog/51929032506\",\"image\":\"https://shopping-phinf.pstatic.net/main_5192903/51929032506.20250206153651.jpg\",\"lprice\":\"15800\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"51929032506\",\"productType\":\"1\",\"brand\":\"왕타\",\"maker\":\"삼정물산\",\"category1\":\"생활/건강\",\"category2\":\"구강위생용품\",\"category3\":\"칫솔\",\"category4\":\"\"},{\"title\":\"슈랙 철제선반 조립식 앵글 베란다 선반 렉 창고 210210600 5단\",\"link\":\"https://smartstore.naver.com/main/products/9216202377\",\"image\":\"https://shopping-phinf.pstatic.net/main_8676070/86760702700.jpg\",\"lprice\":\"50600\",\"hprice\":\"\",\"mallName\":\"슈랙\",\"productId\":\"86760702700\",\"productType\":\"2\",\"brand\":\"슈랙\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"수납/정리용품\",\"category3\":\"선반/진열대\",\"category4\":\"스탠드선반/진열대\"},{\"title\":\"금동이 사각모기장 침대모기장 텐트 캠핑 캐노피 일반소형\",\"link\":\"https://smartstore.naver.com/main/products/134970521\",\"image\":\"https://shopping-phinf.pstatic.net/main_6858329/6858329603.8.jpg\",\"lprice\":\"15900\",\"hprice\":\"\",\"mallName\":\"금동이샵\",\"productId\":\"6858329603\",\"productType\":\"2\",\"brand\":\"금동이\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"모기장\"},{\"title\":\"모기퇴치제 모기기피제 3개\",\"link\":\"https://smartstore.naver.com/main/products/155202468\",\"image\":\"https://shopping-phinf.pstatic.net/main_7588748/7588748032.19.jpg\",\"lprice\":\"7900\",\"hprice\":\"\",\"mallName\":\"다팜메디\",\"productId\":\"7588748032\",\"productType\":\"2\",\"brand\":\"모스넷\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"해충퇴치용품\",\"category4\":\"에어졸/스프레이\"},{\"title\":\"벨크로 촘촘망 미세방충망 현관 롤 베란다 미세먼지 찍찍이 창문필터 모기장 제작 50X10\",\"link\":\"https://smartstore.naver.com/main/products/404981609\",\"image\":\"https://shopping-phinf.pstatic.net/main_9830472/9830472106.3.jpg\",\"lprice\":\"9900\",\"hprice\":\"\",\"mallName\":\"텍스토머\",\"productId\":\"9830472106\",\"productType\":\"2\",\"brand\":\"텍스토머\",\"maker\":\"텍스토머\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"모기장\"},{\"title\":\"다후아 500만화소 CCTV 설치 세트 실외 가정용 스마트폰 매장 야외 4채널 감시 카메라\",\"link\":\"https://smartstore.naver.com/main/products/6776045666\",\"image\":\"https://shopping-phinf.pstatic.net/main_8432054/84320545988.17.jpg\",\"lprice\":\"119900\",\"hprice\":\"\",\"mallName\":\"다봄씨엔에스\",\"productId\":\"84320545988\",\"productType\":\"2\",\"brand\":\"다후아\",\"maker\":\"다후아\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"보안용품\",\"category4\":\"CCTV\"},{\"title\":\"다우니 실내건조 섬유유연제 엑스퍼트 초고농축 4L 코스트코 대용량 플러스 향좋은 향기좋은\",\"link\":\"https://smartstore.naver.com/main/products/5204078443\",\"image\":\"https://shopping-phinf.pstatic.net/main_8274860/82748600072.9.jpg\",\"lprice\":\"15100\",\"hprice\":\"\",\"mallName\":\"티에스shop\",\"productId\":\"82748600072\",\"productType\":\"2\",\"brand\":\"다우니\",\"maker\":\"P&G\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"섬유유연제\",\"category4\":\"고농축섬유유연제\"},{\"title\":\"대용량 텀블러 빨대텀블러 보온보냉텀블러 스텐 손잡이 운동 기념품 소\",\"link\":\"https://smartstore.naver.com/main/products/8702784236\",\"image\":\"https://shopping-phinf.pstatic.net/main_8624728/86247284559.26.jpg\",\"lprice\":\"13800\",\"hprice\":\"\",\"mallName\":\"1리터텀블러\",\"productId\":\"86247284559\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"주방용품\",\"category3\":\"잔/컵\",\"category4\":\"텀블러\"},{\"title\":\"담다 접이식카트 바퀴달린 장바구니캐리어 폴딩 시장바구니 손수레 쇼핑카트 4바퀴L 아이보리\",\"link\":\"https://smartstore.naver.com/main/products/4492877308\",\"image\":\"https://shopping-phinf.pstatic.net/main_8203740/82037400228.12.jpg\",\"lprice\":\"34800\",\"hprice\":\"\",\"mallName\":\"이소품\",\"productId\":\"82037400228\",\"productType\":\"2\",\"brand\":\"이소품\",\"maker\":\"이소품\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"핸드카트\"},{\"title\":\"헨켈 세탁세제 퍼실 캡슐 세제 디스크 실내건조 26개입 2개\",\"link\":\"https://smartstore.naver.com/main/products/6794730889\",\"image\":\"https://shopping-phinf.pstatic.net/main_8433923/84339231211.18.jpg\",\"lprice\":\"27000\",\"hprice\":\"\",\"mallName\":\"헨켈홈케어 공식몰\",\"productId\":\"84339231211\",\"productType\":\"2\",\"brand\":\"퍼실\",\"maker\":\"헨켈\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"세제/세정제\",\"category4\":\"세탁세제\"},{\"title\":\"로티 로티홈시스 플랫폼 쇼핑 접이식 카트, 실버\",\"link\":\"https://search.shopping.naver.com/catalog/53901375199\",\"image\":\"https://shopping-phinf.pstatic.net/main_5390137/53901375199.20250401184119.jpg\",\"lprice\":\"61400\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53901375199\",\"productType\":\"1\",\"brand\":\"로티홈시스\",\"maker\":\"로티\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"핸드카트\"},{\"title\":\"이글루 S8 1개\",\"link\":\"https://search.shopping.naver.com/catalog/54725183303\",\"image\":\"https://shopping-phinf.pstatic.net/main_5472518/54725183303.20250512175046.jpg\",\"lprice\":\"118500\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"54725183303\",\"productType\":\"1\",\"brand\":\"이글루\",\"maker\":\"이글루\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"보안용품\",\"category4\":\"CCTV\"},{\"title\":\"에어컨 세정제 세척제 청소 셀프 클리너 곰팡이 냄새 제거제 스프레이 330ml\",\"link\":\"https://smartstore.naver.com/main/products/4426750526\",\"image\":\"https://shopping-phinf.pstatic.net/main_8197127/81971273079.7.jpg\",\"lprice\":\"3000\",\"hprice\":\"\",\"mallName\":\"-에띠리얼-\",\"productId\":\"81971273079\",\"productType\":\"2\",\"brand\":\"산도깨비\",\"maker\":\"산도깨비\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"세제/세정제\",\"category4\":\"에어컨세정제\"},{\"title\":\"[1+1] 춘몽 섬유탈취제 섬유향수 룸스프레이 도플 패브릭 퍼퓸 217ml 블랑쉬\",\"link\":\"https://smartstore.naver.com/main/products/10555993438\",\"image\":\"https://shopping-phinf.pstatic.net/main_8810049/88100498921.11.jpg\",\"lprice\":\"21800\",\"hprice\":\"\",\"mallName\":\"춘몽\",\"productId\":\"88100498921\",\"productType\":\"2\",\"brand\":\"춘몽\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"제습/방향/탈취\",\"category4\":\"섬유탈취스프레이\"},{\"title\":\"바퀴벌레약 맥스포스 셀렉트 이지겔 20g +먹이통 20개 바퀴벌레없애는법\",\"link\":\"https://smartstore.naver.com/main/products/4760148021\",\"image\":\"https://shopping-phinf.pstatic.net/main_8230466/82304669923.16.jpg\",\"lprice\":\"8700\",\"hprice\":\"\",\"mallName\":\"뉴트리케어\",\"productId\":\"82304669923\",\"productType\":\"2\",\"brand\":\"맥스포스\",\"maker\":\"바이엘크롭사이언스\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"해충퇴치용품\",\"category4\":\"겔\"},{\"title\":\"출입문 방충망 현관문 베란다 아파트 문 모기장 자석 방충문 화이트 90x210\",\"link\":\"https://smartstore.naver.com/main/products/6372161502\",\"image\":\"https://shopping-phinf.pstatic.net/main_8391666/83916661835.5.jpg\",\"lprice\":\"12700\",\"hprice\":\"\",\"mallName\":\"클라씨\",\"productId\":\"83916661835\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"모기장\"},{\"title\":\"랄라 접이식카트 박스 시장 장바구니캐리어 마트 핸드 쇼핑 폴딩카트 4바퀴L\",\"link\":\"https://smartstore.naver.com/main/products/4939028830\",\"image\":\"https://shopping-phinf.pstatic.net/main_8248355/82483553141.50.jpg\",\"lprice\":\"39800\",\"hprice\":\"\",\"mallName\":\"오늘도 랄라\",\"productId\":\"82483553141\",\"productType\":\"2\",\"brand\":\"랄라\",\"maker\":\"드림와이즈컴퍼니\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"핸드카트\"},{\"title\":\"방충망 셀프교체 미세먼지 롤 창문 모기장 알루미늄망 60cmX20cm\",\"link\":\"https://smartstore.naver.com/main/products/4814730329\",\"image\":\"https://shopping-phinf.pstatic.net/main_8235925/82359253087.18.jpg\",\"lprice\":\"420\",\"hprice\":\"\",\"mallName\":\"파머스홈\",\"productId\":\"82359253087\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"모기장\"},{\"title\":\"큐폴드 접이식카트 폴딩박스 세트 프로 장바구니캐리어 4바퀴 핸드 쇼핑\",\"link\":\"https://smartstore.naver.com/main/products/9122216199\",\"image\":\"https://shopping-phinf.pstatic.net/main_8666671/86666716522.jpg\",\"lprice\":\"77900\",\"hprice\":\"\",\"mallName\":\"큐폴드 QFOLD\",\"productId\":\"86666716522\",\"productType\":\"2\",\"brand\":\"큐폴드\",\"maker\":\"파인드프로덕츠\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"핸드카트\"},{\"title\":\"대용량 텀블러 보온 보냉텀블러 빨대 손잡이 스텐 텀블러 차량용 900ml\",\"link\":\"https://smartstore.naver.com/main/products/10526125099\",\"image\":\"https://shopping-phinf.pstatic.net/main_8807063/88070630459.2.jpg\",\"lprice\":\"13300\",\"hprice\":\"\",\"mallName\":\"타이소 코리아\",\"productId\":\"88070630459\",\"productType\":\"2\",\"brand\":\"TYESO\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"주방용품\",\"category3\":\"잔/컵\",\"category4\":\"텀블러\"},{\"title\":\"비오킬 500ml 빈대 벌레 좀벌레퇴치제 베드버그 진드기 살충제 해충 약 바이오킬+마스크\",\"link\":\"https://smartstore.naver.com/main/products/4674195277\",\"image\":\"https://shopping-phinf.pstatic.net/main_8221871/82218715992.15.jpg\",\"lprice\":\"7900\",\"hprice\":\"\",\"mallName\":\"다나아팜\",\"productId\":\"82218715992\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"동성제약\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"해충퇴치용품\",\"category4\":\"에어졸/스프레이\"},{\"title\":\"엔치약 잇몸 케어 천연 생약추출 알란토인 임산부 불소 없는 좋은 치약 N 앤치약\",\"link\":\"https://smartstore.naver.com/main/products/4094549653\",\"image\":\"https://shopping-phinf.pstatic.net/main_8163907/81639070502.8.jpg\",\"lprice\":\"12000\",\"hprice\":\"\",\"mallName\":\"자연팩토리\",\"productId\":\"81639070502\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"구강위생용품\",\"category3\":\"치약\",\"category4\":\"\"},{\"title\":\"방충망닷컴 무료재단 현관방충망 자동롤 국산 MS일반형1000X2100 방충문\",\"link\":\"https://smartstore.naver.com/main/products/5493666220\",\"image\":\"https://shopping-phinf.pstatic.net/main_8303816/83038161352.3.jpg\",\"lprice\":\"56000\",\"hprice\":\"\",\"mallName\":\"방충망 닷컴\",\"productId\":\"83038161352\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"모기장\"},{\"title\":\"접이식 쇼핑 카트 장바구니 캐리어 시장 세바퀴 접이식 손수레 핸드 카트 보급형\",\"link\":\"https://smartstore.naver.com/main/products/4130915605\",\"image\":\"https://shopping-phinf.pstatic.net/main_8167543/81675436659.11.jpg\",\"lprice\":\"38900\",\"hprice\":\"\",\"mallName\":\"지니고몰\",\"productId\":\"81675436659\",\"productType\":\"2\",\"brand\":\"지니고\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"핸드카트\"},{\"title\":\"팩앤롤 중형 접이식 쇼핑카트 장바구니 캐리어 폴딩카트 손수레 핸드카트\",\"link\":\"https://smartstore.naver.com/main/products/2125293206\",\"image\":\"https://shopping-phinf.pstatic.net/main_1207405/12074050645.4.jpg\",\"lprice\":\"12900\",\"hprice\":\"\",\"mallName\":\"SPIELL\",\"productId\":\"12074050645\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"스피엘\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"핸드카트\"},{\"title\":\"코스트코 커클랜드 휴지 3겹40m30롤1팩 화장지 두루마리휴지 물에잘녹는 무형광 프리미엄\",\"link\":\"https://smartstore.naver.com/main/products/4812652177\",\"image\":\"https://shopping-phinf.pstatic.net/main_8235717/82357174887.11.jpg\",\"lprice\":\"20750\",\"hprice\":\"\",\"mallName\":\"티에스shop\",\"productId\":\"82357174887\",\"productType\":\"2\",\"brand\":\"커클랜드\",\"maker\":\"유한킴벌리\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"화장지\",\"category4\":\"롤화장지\"},{\"title\":\"1+1 수호천사파워 100ml 모기기피제 이카리딘15% 진드기 모기 퇴치제 유아 임산부\",\"link\":\"https://smartstore.naver.com/main/products/5312260037\",\"image\":\"https://shopping-phinf.pstatic.net/main_8285675/82856752499.8.jpg\",\"lprice\":\"8400\",\"hprice\":\"\",\"mallName\":\"영진팜\",\"productId\":\"82856752499\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"해충퇴치용품\",\"category4\":\"에어졸/스프레이\"},{\"title\":\"특허받은 USB 충전식 회전 전기 모기채 전자 파리채 해충퇴치 전기채\",\"link\":\"https://smartstore.naver.com/main/products/4503882155\",\"image\":\"https://shopping-phinf.pstatic.net/main_8204840/82048405103.14.jpg\",\"lprice\":\"19900\",\"hprice\":\"\",\"mallName\":\"레인보우 빅마켓\",\"productId\":\"82048405103\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"해충퇴치용품\",\"category4\":\"모기채/파리채\"},{\"title\":\"벅스델타 유제 1L 모기 퇴치제 벌레 집거미 베드버그 초파리 날파리 퇴치 나방파리 퇴치 방역 지네약 돈벌레 퇴치 유충 살충제 모기약\",\"link\":\"https://smartstore.naver.com/main/products/10198332758\",\"image\":\"https://shopping-phinf.pstatic.net/main_8774283/87742836219.7.jpg\",\"lprice\":\"28500\",\"hprice\":\"\",\"mallName\":\"닥터가드몰\",\"productId\":\"87742836219\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"해충퇴치용품\",\"category4\":\"에어졸/스프레이\"},{\"title\":\"포장용 롤 에어캡 뽁뽁이 0.2T 경포장용 20cm x 50M 1롤\",\"link\":\"https://smartstore.naver.com/main/products/5182465882\",\"image\":\"https://shopping-phinf.pstatic.net/main_8272698/82726987088.5.jpg\",\"lprice\":\"3500\",\"hprice\":\"\",\"mallName\":\"황금상사스토어\",\"productId\":\"82726987088\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"단열시트\"},{\"title\":\"사각모기장 침대모기장 텐트 야외모기장 캠핑 방충망 일반형 대형\",\"link\":\"https://smartstore.naver.com/main/products/8471665117\",\"image\":\"https://shopping-phinf.pstatic.net/main_8601616/86016165441.2.jpg\",\"lprice\":\"17900\",\"hprice\":\"\",\"mallName\":\"보스트라이프\",\"productId\":\"86016165441\",\"productType\":\"2\",\"brand\":\"금동이\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"모기장\"},{\"title\":\"모기장 원터치 접이식 침대 아기 텐트 캠핑 대형 싱글 1인용\",\"link\":\"https://smartstore.naver.com/main/products/5714893095\",\"image\":\"https://shopping-phinf.pstatic.net/main_8325939/83259391426.16.jpg\",\"lprice\":\"18800\",\"hprice\":\"\",\"mallName\":\"DR.아이텍\",\"productId\":\"83259391426\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"모기장\"},{\"title\":\"좀벌레싹 옷장 6개입 실버피쉬 옷장 벌레 좀벌레 퇴치제 퇴치법 퇴치약 좀약 트랩\",\"link\":\"https://smartstore.naver.com/main/products/8174326956\",\"image\":\"https://shopping-phinf.pstatic.net/main_8571882/85718827279.4.jpg\",\"lprice\":\"14900\",\"hprice\":\"\",\"mallName\":\"컬러포\",\"productId\":\"85718827279\",\"productType\":\"2\",\"brand\":\"컴배트\",\"maker\":\"헨켈\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"해충퇴치용품\",\"category4\":\"방충제\"},{\"title\":\"엔케이롤 현관 방충망 롤방충망 현관문 자동롤 모기장 무절단 회색 1000x2100 일반형\",\"link\":\"https://smartstore.naver.com/main/products/294104711\",\"image\":\"https://shopping-phinf.pstatic.net/main_8489905/8489905757.10.jpg\",\"lprice\":\"54500\",\"hprice\":\"\",\"mallName\":\"NK테크코리아\",\"productId\":\"8489905757\",\"productType\":\"2\",\"brand\":\"엔케이롤\",\"maker\":\"NK테크\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"모기장\"},{\"title\":\"크리넥스 데코앤소프트 특별기획 3겹 화장지 30롤 2팩 무형광 먼지없는 집들이 두루마리휴지\",\"link\":\"https://smartstore.naver.com/main/products/7624882804\",\"image\":\"https://shopping-phinf.pstatic.net/main_8516938/85169383126.8.jpg\",\"lprice\":\"37500\",\"hprice\":\"\",\"mallName\":\"태라상사\",\"productId\":\"85169383126\",\"productType\":\"2\",\"brand\":\"크리넥스\",\"maker\":\"유한킴벌리\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"화장지\",\"category4\":\"롤화장지\"},{\"title\":\"스피드랙 V2 철제선반 조립식 앵글 렉 선반 창고 베란다 400300600 5단\",\"link\":\"https://smartstore.naver.com/main/products/8805641337\",\"image\":\"https://shopping-phinf.pstatic.net/main_8635014/86350141660.5.jpg\",\"lprice\":\"69900\",\"hprice\":\"\",\"mallName\":\"스피드랙 스토어\",\"productId\":\"86350141660\",\"productType\":\"2\",\"brand\":\"스피드랙\",\"maker\":\"스피드랙\",\"category1\":\"생활/건강\",\"category2\":\"수납/정리용품\",\"category3\":\"선반/진열대\",\"category4\":\"스탠드선반/진열대\"},{\"title\":\"말표산업 말표 블랙시트 20매, 1개\",\"link\":\"https://search.shopping.naver.com/catalog/55379785025\",\"image\":\"https://shopping-phinf.pstatic.net/main_5537978/55379785025.20250619120435.jpg\",\"lprice\":\"7000\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"55379785025\",\"productType\":\"1\",\"brand\":\"말표\",\"maker\":\"말표산업\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"세제/세정제\",\"category4\":\"세탁세제\"},{\"title\":\"홈캠거치대 이글루캠 헤이홈 타포 샤오미 티피링크 호환 무타공 부착형\",\"link\":\"https://smartstore.naver.com/main/products/10322980791\",\"image\":\"https://shopping-phinf.pstatic.net/main_8786748/87867484917.2.jpg\",\"lprice\":\"11900\",\"hprice\":\"\",\"mallName\":\"홈스탠드\",\"productId\":\"87867484917\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"보안용품\",\"category4\":\"CCTV\"},{\"title\":\"홈키파 홈매트 리퀴드 맥스 제로 훈증기+리필 45일 액체 액상 전자 전기 모기약 모기향\",\"link\":\"https://smartstore.naver.com/main/products/9999483328\",\"image\":\"https://shopping-phinf.pstatic.net/main_8754398/87543985601.1.jpg\",\"lprice\":\"9980\",\"hprice\":\"\",\"mallName\":\"84년생 부엉이\",\"productId\":\"87543985601\",\"productType\":\"2\",\"brand\":\"홈매트\",\"maker\":\"헨켈\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"해충퇴치용품\",\"category4\":\"리퀴드\"},{\"title\":\"에어킹 포장뽁뽁이  20cmx50m, 5개\",\"link\":\"https://search.shopping.naver.com/catalog/55077096239\",\"image\":\"https://shopping-phinf.pstatic.net/main_5507709/55077096239.20250602120340.jpg\",\"lprice\":\"14500\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"55077096239\",\"productType\":\"1\",\"brand\":\"에어킹\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"단열시트\"},{\"title\":\"창틀벌레 모풍지판 창문 벌레 차단 틈새 창문틈 막이 방충망\",\"link\":\"https://smartstore.naver.com/main/products/6293889960\",\"image\":\"https://shopping-phinf.pstatic.net/main_8383839/83838392449.1.jpg\",\"lprice\":\"2300\",\"hprice\":\"\",\"mallName\":\"우예스토어\",\"productId\":\"83838392449\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"문풍지\"},{\"title\":\"화장실 하수구트랩 50mm 덮개 배수구트랩 냄새제거 차단 베란다 악취 벌레 하수도 역류\",\"link\":\"https://smartstore.naver.com/main/products/115297276\",\"image\":\"https://shopping-phinf.pstatic.net/main_6610700/6610700948.17.jpg\",\"lprice\":\"15900\",\"hprice\":\"\",\"mallName\":\"빌리브샵\",\"productId\":\"6610700948\",\"productType\":\"2\",\"brand\":\"SMZ냄새제로\",\"maker\":\"에스엠지\",\"category1\":\"생활/건강\",\"category2\":\"욕실용품\",\"category3\":\"샤워기/수전용품\",\"category4\":\"배수구캡\"},{\"title\":\"에코버 식기세척기세제 제로 500g, 2개\",\"link\":\"https://search.shopping.naver.com/catalog/52269069619\",\"image\":\"https://shopping-phinf.pstatic.net/main_5226906/52269069619.20250103145320.jpg\",\"lprice\":\"27900\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"52269069619\",\"productType\":\"1\",\"brand\":\"에코버\",\"maker\":\"에코버\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"세제/세정제\",\"category4\":\"식기세척기전용세제\"},{\"title\":\"선일금고 루셀 소형 가정용 금고 YES-031D\",\"link\":\"https://search.shopping.naver.com/catalog/6691041836\",\"image\":\"https://shopping-phinf.pstatic.net/main_6691041/6691041836.20230404094801.jpg\",\"lprice\":\"223390\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"6691041836\",\"productType\":\"1\",\"brand\":\"루셀\",\"maker\":\"선일금고\",\"category1\":\"생활/건강\",\"category2\":\"문구/사무용품\",\"category3\":\"사무기기\",\"category4\":\"금고\"},{\"title\":\"물먹는하마 옷장용 제습제 525g, 12개\",\"link\":\"https://search.shopping.naver.com/catalog/54767725838\",\"image\":\"https://shopping-phinf.pstatic.net/main_5476772/54767725838.20250522133457.jpg\",\"lprice\":\"18280\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"54767725838\",\"productType\":\"1\",\"brand\":\"물먹는하마\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"제습/방향/탈취\",\"category4\":\"제습제\"},{\"title\":\"롤 에어캡 포장 뽁뽁이 택배 완충 포장용 50cmX50m 0.2T 1롤\",\"link\":\"https://smartstore.naver.com/main/products/7170955325\",\"image\":\"https://shopping-phinf.pstatic.net/main_8471545/84715455647.jpg\",\"lprice\":\"7200\",\"hprice\":\"\",\"mallName\":\"이고다포장\",\"productId\":\"84715455647\",\"productType\":\"2\",\"brand\":\"이고다\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"단열시트\"},{\"title\":\"커클랜드 캡슐세제 울트라클린팩 코스트코 세제 추천\",\"link\":\"https://smartstore.naver.com/main/products/5621546440\",\"image\":\"https://shopping-phinf.pstatic.net/main_8316604/83166042955.14.jpg\",\"lprice\":\"19690\",\"hprice\":\"\",\"mallName\":\"바이플랫\",\"productId\":\"83166042955\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"세제/세정제\",\"category4\":\"세탁세제\"},{\"title\":\"홈트너 제습제 옷장제습제 습기제거제 옷걸이형 250g, 20개\",\"link\":\"https://smartstore.naver.com/main/products/10389688304\",\"image\":\"https://shopping-phinf.pstatic.net/main_8793419/87934193163.jpg\",\"lprice\":\"22500\",\"hprice\":\"\",\"mallName\":\"홈트너\",\"productId\":\"87934193163\",\"productType\":\"2\",\"brand\":\"홈트너\",\"maker\":\"홈트너\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"제습/방향/탈취\",\"category4\":\"제습제\"},{\"title\":\"실리카겔 50g 습기제거제 제품 /산업 신발 의류 방습제\",\"link\":\"https://smartstore.naver.com/main/products/4549948287\",\"image\":\"https://shopping-phinf.pstatic.net/main_8209446/82094468339.4.jpg\",\"lprice\":\"280\",\"hprice\":\"\",\"mallName\":\"제이제이상사\",\"productId\":\"82094468339\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"제습/방향/탈취\",\"category4\":\"제습제\"},{\"title\":\"맥스포스겔 바퀴벌레약 셀렉트 이지 겔 바퀴벌레퇴치 230g, 1개\",\"link\":\"https://smartstore.naver.com/main/products/10663150138\",\"image\":\"https://shopping-phinf.pstatic.net/main_8820765/88207656052.3.jpg\",\"lprice\":\"29500\",\"hprice\":\"\",\"mallName\":\"토마스팜\",\"productId\":\"88207656052\",\"productType\":\"2\",\"brand\":\"BAYER\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"해충퇴치용품\",\"category4\":\"겔\"},{\"title\":\"홈트너 제습제 옷장제습제 습기제거제 선반형 570ml 250g, 24개\",\"link\":\"https://smartstore.naver.com/main/products/11722065095\",\"image\":\"https://shopping-phinf.pstatic.net/main_8926657/89266575594.jpg\",\"lprice\":\"20900\",\"hprice\":\"\",\"mallName\":\"홈트너\",\"productId\":\"89266575594\",\"productType\":\"2\",\"brand\":\"홈트너\",\"maker\":\"홈트너\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"제습/방향/탈취\",\"category4\":\"제습제\"},{\"title\":\"대용량 옷장제습제 옷걸이형제습제 옷걸이제습제 8개\",\"link\":\"https://smartstore.naver.com/main/products/6872914080\",\"image\":\"https://shopping-phinf.pstatic.net/main_8441741/84417414402.9.jpg\",\"lprice\":\"18500\",\"hprice\":\"\",\"mallName\":\"주식회사 생활공작소\",\"productId\":\"84417414402\",\"productType\":\"2\",\"brand\":\"생활공작소\",\"maker\":\"생활공작소\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"제습/방향/탈취\",\"category4\":\"제습제\"},{\"title\":\"홈캠거치대 스탠드 헤이홈 타포 이글루캠 티피링크 샤오미 호환 무타공\",\"link\":\"https://smartstore.naver.com/main/products/9960717951\",\"image\":\"https://shopping-phinf.pstatic.net/main_8750522/87505220224.3.jpg\",\"lprice\":\"32800\",\"hprice\":\"\",\"mallName\":\"홈스탠드\",\"productId\":\"87505220224\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"보안용품\",\"category4\":\"CCTV\"},{\"title\":\"롤 에어캡 뽁뽁이 택배 포장 완충 포장용 50cmX50m 0.2T 2롤\",\"link\":\"https://smartstore.naver.com/main/products/6956192800\",\"image\":\"https://shopping-phinf.pstatic.net/main_8450069/84500693122.jpg\",\"lprice\":\"14000\",\"hprice\":\"\",\"mallName\":\"이고다포장\",\"productId\":\"84500693122\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"단열시트\"},{\"title\":\"고화질 헤이홈 PRO 홈카메라 가정용 반려동물 홈캠 CCTV 베이비캠 ip카메라 펫캠\",\"link\":\"https://smartstore.naver.com/main/products/4799243915\",\"image\":\"https://shopping-phinf.pstatic.net/main_8234376/82343766518.20.jpg\",\"lprice\":\"59900\",\"hprice\":\"\",\"mallName\":\"똑똑한집\",\"productId\":\"82343766518\",\"productType\":\"2\",\"brand\":\"헤이홈\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"보안용품\",\"category4\":\"CCTV\"},{\"title\":\"로긴 304 올스텐 이동식 세탁 빨래바구니 2단\",\"link\":\"https://search.shopping.naver.com/catalog/49472008932\",\"image\":\"https://shopping-phinf.pstatic.net/main_4947200/49472008932.20250516053328.jpg\",\"lprice\":\"159000\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"49472008932\",\"productType\":\"1\",\"brand\":\"로긴\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"세탁용품\",\"category3\":\"빨래바구니\",\"category4\":\"\"},{\"title\":\"콜게이트 치약 코스트코 250g5개입 잇몸 입냄새 불소 1450 고불소 그레이트 레귤러\",\"link\":\"https://smartstore.naver.com/main/products/9360080926\",\"image\":\"https://shopping-phinf.pstatic.net/main_8690458/86904581249.2.jpg\",\"lprice\":\"19650\",\"hprice\":\"\",\"mallName\":\"티에스shop\",\"productId\":\"86904581249\",\"productType\":\"2\",\"brand\":\"콜게이트\",\"maker\":\"콜게이트\",\"category1\":\"생활/건강\",\"category2\":\"구강위생용품\",\"category3\":\"치약\",\"category4\":\"\"},{\"title\":\"깨끗한나라 순수프리미엄 3겹 33m, 30롤, 2팩\",\"link\":\"https://search.shopping.naver.com/catalog/53531282602\",\"image\":\"https://shopping-phinf.pstatic.net/main_5353128/53531282602.20250313165432.jpg\",\"lprice\":\"23380\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53531282602\",\"productType\":\"1\",\"brand\":\"깨끗한나라\",\"maker\":\"깨끗한나라\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"화장지\",\"category4\":\"롤화장지\"},{\"title\":\"[프로쉬] 식기세척기 세제 72개 베이킹소다 올인원 대용량 코스트코 식세기세제\",\"link\":\"https://smartstore.naver.com/main/products/11093986871\",\"image\":\"https://shopping-phinf.pstatic.net/main_8863849/88638497193.4.jpg\",\"lprice\":\"22590\",\"hprice\":\"\",\"mallName\":\"굿 바이즈\",\"productId\":\"88638497193\",\"productType\":\"2\",\"brand\":\"프로쉬\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"세제/세정제\",\"category4\":\"식기세척기전용세제\"},{\"title\":\"피크닉매트 방수돗자리 두꺼운돗자리 푹신한 대형 옐로우\",\"link\":\"https://smartstore.naver.com/main/products/8176642287\",\"image\":\"https://shopping-phinf.pstatic.net/main_8572114/85721142610.11.jpg\",\"lprice\":\"22800\",\"hprice\":\"\",\"mallName\":\"땡스투기프트\",\"productId\":\"85721142610\",\"productType\":\"2\",\"brand\":\"솜솜라이크\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"돗자리/매트\"},{\"title\":\"비트 딥클린 파워세탁 액체 세탁세제 3L 본품x4개+캡슐 5입\",\"link\":\"https://smartstore.naver.com/main/products/639909638\",\"image\":\"https://shopping-phinf.pstatic.net/main_1095711/10957110278.53.jpg\",\"lprice\":\"26900\",\"hprice\":\"\",\"mallName\":\"라이온코리아 브랜드스토어\",\"productId\":\"10957110278\",\"productType\":\"2\",\"brand\":\"비트\",\"maker\":\"라이온코리아\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"세제/세정제\",\"category4\":\"세탁세제\"},{\"title\":\"코스트코 커클랜드 키친타올 160매12롤x1팩 종이타올 주방 업소용 대용량 두꺼운 타월\",\"link\":\"https://smartstore.naver.com/main/products/7831231132\",\"image\":\"https://shopping-phinf.pstatic.net/main_8537573/85375731454.8.jpg\",\"lprice\":\"29790\",\"hprice\":\"\",\"mallName\":\"티에스shop\",\"productId\":\"85375731454\",\"productType\":\"2\",\"brand\":\"커클랜드\",\"maker\":\"코스트코\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"화장지\",\"category4\":\"키친타월\"},{\"title\":\"코스트코 커클랜드 키친타올 160매12롤x1팩 종이타올 주방 업소용 대용량 두꺼운 타월\",\"link\":\"https://smartstore.naver.com/main/products/7831231132\",\"image\":\"https://shopping-phinf.pstatic.net/main_8537573/85375731454.8.jpg\",\"lprice\":\"29790\",\"hprice\":\"\",\"mallName\":\"티에스shop\",\"productId\":\"85375731454\",\"productType\":\"2\",\"brand\":\"커클랜드\",\"maker\":\"코스트코\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"화장지\",\"category4\":\"키친타월\"},{\"title\":\"대용량 텀블러 퀜처 보온 보냉텀블러 빨대 손잡이텀블러 대형 차량용\",\"link\":\"https://smartstore.naver.com/main/products/8469600558\",\"image\":\"https://shopping-phinf.pstatic.net/main_8601410/86014100881.12.jpg\",\"lprice\":\"13000\",\"hprice\":\"\",\"mallName\":\"1리터텀블러 마켓\",\"productId\":\"86014100881\",\"productType\":\"2\",\"brand\":\"TYESO\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"주방용품\",\"category3\":\"잔/컵\",\"category4\":\"텀블러\"},{\"title\":\"유니레버 스너글 초고농축 섬유유연제 허거블코튼 , 1.8L, 1개\",\"link\":\"https://search.shopping.naver.com/catalog/55381714650\",\"image\":\"https://shopping-phinf.pstatic.net/main_5538171/55381714650.20250619160239.jpg\",\"lprice\":\"9900\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"55381714650\",\"productType\":\"1\",\"brand\":\"스너글\",\"maker\":\"유니레버\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"섬유유연제\",\"category4\":\"고농축섬유유연제\"},{\"title\":\"바퀴벌레약 맥스포스셀렉트 이지겔 20g\",\"link\":\"https://smartstore.naver.com/main/products/371021853\",\"image\":\"https://shopping-phinf.pstatic.net/main_9543148/9543148198.41.jpg\",\"lprice\":\"11000\",\"hprice\":\"\",\"mallName\":\"마당클럽\",\"productId\":\"9543148198\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"해충퇴치용품\",\"category4\":\"겔\"},{\"title\":\"뚱크 감성 피크닉 매트 휴대용 야외 비치 방수 돗자리\",\"link\":\"https://search.shopping.naver.com/catalog/54942592848\",\"image\":\"https://shopping-phinf.pstatic.net/main_5494259/54942592848.20250525095300.jpg\",\"lprice\":\"10900\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"54942592848\",\"productType\":\"1\",\"brand\":\"뚱크\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"돗자리/매트\"},{\"title\":\"이지 원터치 사각모기장 텐트 침대 캠핑 방충망 싱글\",\"link\":\"https://search.shopping.naver.com/catalog/48639360194\",\"image\":\"https://shopping-phinf.pstatic.net/main_4863936/48639360194.20250228182558.jpg\",\"lprice\":\"10900\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"48639360194\",\"productType\":\"1\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"모기장\"},{\"title\":\"페스트세븐 초파리 트랩 퇴치 날벌레 날파리 나방 벼룩 뿌리 파리 끈끈이 없애는법 퇴치법 퇴치제 제거\",\"link\":\"https://smartstore.naver.com/main/products/5076552040\",\"image\":\"https://shopping-phinf.pstatic.net/main_8262107/82621073724.6.jpg\",\"lprice\":\"9950\",\"hprice\":\"\",\"mallName\":\"페스트세븐\",\"productId\":\"82621073724\",\"productType\":\"2\",\"brand\":\"페스트세븐\",\"maker\":\"페스트세븐\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"해충퇴치용품\",\"category4\":\"끈끈이\"},{\"title\":\"맥스포스셀렉트겔20g + 먹이캡 30개 약국 맥스포겔 바퀴벌레없애는 퇴치법 바퀴벌레약\",\"link\":\"https://smartstore.naver.com/main/products/7569771250\",\"image\":\"https://shopping-phinf.pstatic.net/main_8511427/85114271572.jpg\",\"lprice\":\"13900\",\"hprice\":\"\",\"mallName\":\"리노 스토어\",\"productId\":\"85114271572\",\"productType\":\"2\",\"brand\":\"맥스포스\",\"maker\":\"바이엘크롭사이언스\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"해충퇴치용품\",\"category4\":\"겔\"},{\"title\":\"울트라델타 모기 파리 나방파리 초파리 벌레 유충 정화조 연막 퇴치제 살충제 지네 바퀴벌레 돈벌레 그리마 좀벌레 퇴치 약 퇴치법\",\"link\":\"https://smartstore.naver.com/main/products/2038170230\",\"image\":\"https://shopping-phinf.pstatic.net/main_1178122/11781220969.6.jpg\",\"lprice\":\"29000\",\"hprice\":\"\",\"mallName\":\"비티글로벌\",\"productId\":\"11781220969\",\"productType\":\"2\",\"brand\":\"모스헌터\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"해충퇴치용품\",\"category4\":\"에어졸/스프레이\"},{\"title\":\"파인디지털 파인뷰 AI 모션 트래킹 홈캠 CCTV K90 1개\",\"link\":\"https://search.shopping.naver.com/catalog/53955305824\",\"image\":\"https://shopping-phinf.pstatic.net/main_5395530/53955305824.20250404104816.jpg\",\"lprice\":\"59000\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53955305824\",\"productType\":\"1\",\"brand\":\"파인뷰\",\"maker\":\"파인디지털\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"보안용품\",\"category4\":\"CCTV\"},{\"title\":\"엔케이롤 현관방충망 자동롤 방충문 주문제작 교체시공 미세촘촘 절단 고급형 1000x2100\",\"link\":\"https://smartstore.naver.com/main/products/294104793\",\"image\":\"https://shopping-phinf.pstatic.net/main_8489916/8489916006.11.jpg\",\"lprice\":\"86500\",\"hprice\":\"\",\"mallName\":\"NK테크코리아\",\"productId\":\"8489916006\",\"productType\":\"2\",\"brand\":\"엔케이롤\",\"maker\":\"NK테크\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"모기장\"},{\"title\":\"1+1 살림백서 세탁세제 액체세제 천연 유래98% 2L 중성 드럼 세탁기 일반 대용량\",\"link\":\"https://smartstore.naver.com/main/products/2038109297\",\"image\":\"https://shopping-phinf.pstatic.net/main_1178110/11781100542.17.jpg\",\"lprice\":\"12900\",\"hprice\":\"\",\"mallName\":\"살림백서\",\"productId\":\"11781100542\",\"productType\":\"2\",\"brand\":\"살림백서\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"세제/세정제\",\"category4\":\"세탁세제\"},{\"title\":\"코맥스 인터폰 비디오폰 아날로그 아파트 주택 교체 설치 현관 초인종 별도 CAV43M\",\"link\":\"https://smartstore.naver.com/main/products/5866177635\",\"image\":\"https://shopping-phinf.pstatic.net/main_8341067/83410677049.8.jpg\",\"lprice\":\"55000\",\"hprice\":\"\",\"mallName\":\"KMplus\",\"productId\":\"83410677049\",\"productType\":\"2\",\"brand\":\"COMMAX\",\"maker\":\"COMMAX\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"보안용품\",\"category4\":\"기타보안용품\"},{\"title\":\"이노베이티브 전기 모기채 90도 회전 전자 파리채 대형 그레이 충전식 초파리 전기채\",\"link\":\"https://smartstore.naver.com/main/products/6375992557\",\"image\":\"https://shopping-phinf.pstatic.net/main_8392049/83920492890.15.jpg\",\"lprice\":\"29800\",\"hprice\":\"\",\"mallName\":\"이노베이티브리빙\",\"productId\":\"83920492890\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"해충퇴치용품\",\"category4\":\"모기채/파리채\"},{\"title\":\"CLA 듀얼 울트라 클린 캡슐세제 클린코튼 100개입, 클린코튼, 2개\",\"link\":\"https://search.shopping.naver.com/catalog/55003035568\",\"image\":\"https://shopping-phinf.pstatic.net/main_5500303/55003035568.20250528123648.jpg\",\"lprice\":\"18930\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"55003035568\",\"productType\":\"1\",\"brand\":\"CLA\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"세제/세정제\",\"category4\":\"세탁세제\"},{\"title\":\"GS칼텍스 킥스 PAO1 0W30 1L, 5개\",\"link\":\"https://search.shopping.naver.com/catalog/54894783454\",\"image\":\"https://shopping-phinf.pstatic.net/main_5489478/54894783454.20250521172441.jpg\",\"lprice\":\"44500\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"54894783454\",\"productType\":\"1\",\"brand\":\"킥스\",\"maker\":\"GS칼텍스\",\"category1\":\"생활/건강\",\"category2\":\"자동차용품\",\"category3\":\"오일/소모품\",\"category4\":\"엔진오일\"},{\"title\":\"PVC 투명 젤리 쇼핑백 1호 와인 답례품 구디백 비닐 손잡이 미니 간식 선물포장\",\"link\":\"https://smartstore.naver.com/main/products/7522712674\",\"image\":\"https://shopping-phinf.pstatic.net/main_8506721/85067212996.1.jpg\",\"lprice\":\"220\",\"hprice\":\"\",\"mallName\":\"기브N기브\",\"productId\":\"85067212996\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"쇼핑백\"},{\"title\":\"스탠드형 옷장제습제 옷장용제습제 대용량제습제 16개\",\"link\":\"https://smartstore.naver.com/main/products/6862149822\",\"image\":\"https://shopping-phinf.pstatic.net/main_8440665/84406650144.8.jpg\",\"lprice\":\"20900\",\"hprice\":\"\",\"mallName\":\"주식회사 생활공작소\",\"productId\":\"84406650144\",\"productType\":\"2\",\"brand\":\"생활공작소\",\"maker\":\"올덴\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"제습/방향/탈취\",\"category4\":\"제습제\"},{\"title\":\"다우니 엑스퍼트 실내건조 섬유유연제 프레시클린, 1L, 5개\",\"link\":\"https://search.shopping.naver.com/catalog/54273979981\",\"image\":\"https://shopping-phinf.pstatic.net/main_5427397/54273979981.20250418095317.jpg\",\"lprice\":\"25890\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"54273979981\",\"productType\":\"1\",\"brand\":\"다우니\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"섬유유연제\",\"category4\":\"고농축섬유유연제\"},{\"title\":\"맥세이프 차량용 거치대 진공흡착 대시보드 핸드폰 태블릿 자석 테슬라 카니발 쏘렌토 벤츠\",\"link\":\"https://smartstore.naver.com/main/products/11355634698\",\"image\":\"https://shopping-phinf.pstatic.net/main_8890014/88900145049.jpg\",\"lprice\":\"17800\",\"hprice\":\"\",\"mallName\":\"올거치\",\"productId\":\"88900145049\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"자동차용품\",\"category3\":\"휴대폰용품\",\"category4\":\"차량용휴대폰거치대\"},{\"title\":\"나이키 리유저블 쇼핑백 소형 타포린백 쇼퍼백 에코백 장바구니 운동 헬스 가방 방수\",\"link\":\"https://smartstore.naver.com/main/products/6642533357\",\"image\":\"https://shopping-phinf.pstatic.net/main_8418703/84187033679.6.jpg\",\"lprice\":\"2890\",\"hprice\":\"\",\"mallName\":\"소울 컴퍼니sc\",\"productId\":\"84187033679\",\"productType\":\"2\",\"brand\":\"나이키\",\"maker\":\"나이키\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"쇼핑백\"},{\"title\":\"방문방음 문틈 창문 방문 틈새막이 소음차단 문틈막이 방음재 고무 문풍지 현관문 패킹 I형\",\"link\":\"https://smartstore.naver.com/main/products/6106851858\",\"image\":\"https://shopping-phinf.pstatic.net/main_8365135/83651351346.10.jpg\",\"lprice\":\"2900\",\"hprice\":\"\",\"mallName\":\"주알보\",\"productId\":\"83651351346\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"문풍지\"},{\"title\":\"모나리자 미용티슈 250매, 6개\",\"link\":\"https://search.shopping.naver.com/catalog/54626507920\",\"image\":\"https://shopping-phinf.pstatic.net/main_5462650/54626507920.20250507093536.jpg\",\"lprice\":\"7250\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"54626507920\",\"productType\":\"1\",\"brand\":\"모나리자\",\"maker\":\"모나리자\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"화장지\",\"category4\":\"갑티슈\"},{\"title\":\"로티 로티홈시스 트랜스폼 쇼핑 접이식 카트, 블랙\",\"link\":\"https://search.shopping.naver.com/catalog/53875383579\",\"image\":\"https://shopping-phinf.pstatic.net/main_5387538/53875383579.20250612131833.jpg\",\"lprice\":\"71400\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53875383579\",\"productType\":\"1\",\"brand\":\"로티홈시스\",\"maker\":\"로티\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"핸드카트\"},{\"title\":\"베오라 차량용 우산형 햇빛가리개 자동차 앞유리 창문 햇볕 가림막\",\"link\":\"https://smartstore.naver.com/main/products/5713093059\",\"image\":\"https://shopping-phinf.pstatic.net/main_8325759/83257591390.12.jpg\",\"lprice\":\"6800\",\"hprice\":\"\",\"mallName\":\"베오라\",\"productId\":\"83257591390\",\"productType\":\"2\",\"brand\":\"베오라\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"자동차용품\",\"category3\":\"인테리어용품\",\"category4\":\"차량용햇빛가리개\"},{\"title\":\"뽁뽁이 포장용 롤 에어캡 0.2T 50cm 50M 2롤\",\"link\":\"https://smartstore.naver.com/main/products/10607575860\",\"image\":\"https://shopping-phinf.pstatic.net/main_8815208/88152081450.2.jpg\",\"lprice\":\"13300\",\"hprice\":\"\",\"mallName\":\"포장자재몰\",\"productId\":\"88152081450\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"단열시트\"},{\"title\":\"더블에이 A4용지 복사용지 80g 2500매, 2개\",\"link\":\"https://search.shopping.naver.com/catalog/51929532141\",\"image\":\"https://shopping-phinf.pstatic.net/main_5192953/51929532141.20241213221241.jpg\",\"lprice\":\"43800\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"51929532141\",\"productType\":\"1\",\"brand\":\"더블에이\",\"maker\":\"더블에이\",\"category1\":\"생활/건강\",\"category2\":\"문구/사무용품\",\"category3\":\"용지\",\"category4\":\"복사지\"},{\"title\":\"태양 홈키파 엘비이 알파 수성 에어졸 500ml, 1개\",\"link\":\"https://search.shopping.naver.com/catalog/52481568603\",\"image\":\"https://shopping-phinf.pstatic.net/main_5248156/52481568603.20250114124554.jpg\",\"lprice\":\"1820\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"52481568603\",\"productType\":\"1\",\"brand\":\"홈키파\",\"maker\":\"태양\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"해충퇴치용품\",\"category4\":\"에어졸/스프레이\"},{\"title\":\"슬라이락 샷시 창문 잠금장치 열림방지 스토퍼 G102 방충망고정 미닫이문 베란다 방범장치\",\"link\":\"https://smartstore.naver.com/main/products/2058184292\",\"image\":\"https://shopping-phinf.pstatic.net/main_1185453/11854533297.10.jpg\",\"lprice\":\"11000\",\"hprice\":\"\",\"mallName\":\"에누리 스토어\",\"productId\":\"11854533297\",\"productType\":\"2\",\"brand\":\"슬라이락\",\"maker\":\"GLORYTEC\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"보안용품\",\"category4\":\"도어락/안전고리\"},{\"title\":\"디엠공사 현관방충망 접이식 현관방범방충문 그릴망 백색\",\"link\":\"https://smartstore.naver.com/main/products/4343271229\",\"image\":\"https://shopping-phinf.pstatic.net/main_8188779/81887793257.12.jpg\",\"lprice\":\"275000\",\"hprice\":\"\",\"mallName\":\"디엠공사\",\"productId\":\"81887793257\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"모기장\"},{\"title\":\"롤 에어캡 포장 뽁뽁이 완충 포장용 더블2T 50cm x 50M 4롤\",\"link\":\"https://smartstore.naver.com/main/products/393813507\",\"image\":\"https://shopping-phinf.pstatic.net/main_9740449/9740449684.4.jpg\",\"lprice\":\"28000\",\"hprice\":\"\",\"mallName\":\"뽁뽁이공장\",\"productId\":\"9740449684\",\"productType\":\"2\",\"brand\":\"에어킹\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"단열시트\"},{\"title\":\"시모무라 채칼 4종세트 화이트 만능 당근 양배추 채칼 필러 야채 슬라이서 감자칼 무채칼\",\"link\":\"https://smartstore.naver.com/main/products/9104602174\",\"image\":\"https://shopping-phinf.pstatic.net/main_8664910/86649102497.8.jpg\",\"lprice\":\"12500\",\"hprice\":\"\",\"mallName\":\"라미스홈\",\"productId\":\"86649102497\",\"productType\":\"2\",\"brand\":\"시모무라\",\"maker\":\"시모무라\",\"category1\":\"생활/건강\",\"category2\":\"주방용품\",\"category3\":\"칼/커팅기구\",\"category4\":\"채칼/필러\"},{\"title\":\"피톤치드 편백수 스프레이 원액 2L 편백나무 오일 수액 새집증후군 페인트 제거 방법 새차 탄 새가구 이불 곰팡이 냄새 베이크아웃 퇴치제 침대 집먼지 천연 셀프 청소 퇴치\",\"link\":\"https://smartstore.naver.com/main/products/321150888\",\"image\":\"https://shopping-phinf.pstatic.net/main_8794978/8794978502.60.jpg\",\"lprice\":\"16900\",\"hprice\":\"\",\"mallName\":\"김민재편백\",\"productId\":\"8794978502\",\"productType\":\"2\",\"brand\":\"김민재편백\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"제습/방향/탈취\",\"category4\":\"새집증후군/진드기\"},{\"title\":\"토리 리빙폴리쉬 욕실 주방 가구 다목적 세정제 찌든때 손때 제거제 물때 클리너\",\"link\":\"https://smartstore.naver.com/main/products/9455240960\",\"image\":\"https://shopping-phinf.pstatic.net/main_8699974/86999741283.6.jpg\",\"lprice\":\"34000\",\"hprice\":\"\",\"mallName\":\"TORRI\",\"productId\":\"86999741283\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"세제/세정제\",\"category4\":\"일반주방세제\"},{\"title\":\"[New 다막아방충망] 미세 먼지 창문 프로젝트 자동 스크린 롤 방충망 틀 시공 제작(300x300/화이트)\",\"link\":\"https://smartstore.naver.com/main/products/6308394553\",\"image\":\"https://shopping-phinf.pstatic.net/main_8385289/83852897042.12.jpg\",\"lprice\":\"13420\",\"hprice\":\"\",\"mallName\":\"다막아방충망\",\"productId\":\"83852897042\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"모기장\"},{\"title\":\"이글루캠S4+ 플러스 베이비 신생아 홈CCTV 집안 가정용 모니터 펫캠 이글루홈캠 본품\",\"link\":\"https://smartstore.naver.com/main/products/9472235915\",\"image\":\"https://shopping-phinf.pstatic.net/main_8701673/87016736238.jpg\",\"lprice\":\"89800\",\"hprice\":\"\",\"mallName\":\"오후의 삶\",\"productId\":\"87016736238\",\"productType\":\"2\",\"brand\":\"이글루캠\",\"maker\":\"트루엔\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"보안용품\",\"category4\":\"CCTV\"},{\"title\":\"계피오일 스프레이 1개입, 1개\",\"link\":\"https://search.shopping.naver.com/catalog/55209097505\",\"image\":\"https://shopping-phinf.pstatic.net/main_5520909/55209097505.20250609101607.jpg\",\"lprice\":\"26900\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"55209097505\",\"productType\":\"1\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"해충퇴치용품\",\"category4\":\"방충제\"},{\"title\":\"프리미엄 클린 보틀 대용량 자동 변기세정제 클리너 4개\",\"link\":\"https://smartstore.naver.com/main/products/11457974697\",\"image\":\"https://shopping-phinf.pstatic.net/main_8900248/89002485063.jpg\",\"lprice\":\"12900\",\"hprice\":\"\",\"mallName\":\"더스마티\",\"productId\":\"89002485063\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"세제/세정제\",\"category4\":\"변기세정제\"},{\"title\":\"프로쉬 알로에베라 세탁세제 6L 코스트코 독일 고농축 액상 액체 세제 친환경\",\"link\":\"https://smartstore.naver.com/main/products/8868352674\",\"image\":\"https://shopping-phinf.pstatic.net/main_8641285/86412852997.9.jpg\",\"lprice\":\"28790\",\"hprice\":\"\",\"mallName\":\"티에스shop\",\"productId\":\"86412852997\",\"productType\":\"2\",\"brand\":\"프로쉬\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"세제/세정제\",\"category4\":\"세탁세제\"},{\"title\":\"네오플램 전자렌지용 냉동밥 보관용기 10P 360ml 반찬통\",\"link\":\"https://smartstore.naver.com/main/products/7015716211\",\"image\":\"https://shopping-phinf.pstatic.net/main_8456021/84560216533.5.jpg\",\"lprice\":\"44800\",\"hprice\":\"\",\"mallName\":\"리빙스토리\",\"productId\":\"84560216533\",\"productType\":\"2\",\"brand\":\"네오플램\",\"maker\":\"네오플램\",\"category1\":\"생활/건강\",\"category2\":\"주방용품\",\"category3\":\"보관/밀폐용기\",\"category4\":\"도자기/유리용기\"},{\"title\":\"제이비제이 JBJ 올인원 올스텐 식기건조대 쟁반형 2단\",\"link\":\"https://search.shopping.naver.com/catalog/35681690230\",\"image\":\"https://shopping-phinf.pstatic.net/main_3568169/35681690230.20240519010549.jpg\",\"lprice\":\"97320\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"35681690230\",\"productType\":\"1\",\"brand\":\"제이비제이\",\"maker\":\"제이비제이\",\"category1\":\"생활/건강\",\"category2\":\"주방용품\",\"category3\":\"주방수납용품\",\"category4\":\"식기건조대\"},{\"title\":\"암웨이 프리워시 스프레이 세제 얼룩제거제\",\"link\":\"https://smartstore.naver.com/main/products/8606816544\",\"image\":\"https://shopping-phinf.pstatic.net/main_8615131/86151316867.8.jpg\",\"lprice\":\"14300\",\"hprice\":\"\",\"mallName\":\"NATUREMARKET\",\"productId\":\"86151316867\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"세제/세정제\",\"category4\":\"세탁보조제\"},{\"title\":\"순수한면 제로 생리대 중형 64p 순면 안전한 친환경\",\"link\":\"https://smartstore.naver.com/main/products/9333916814\",\"image\":\"https://shopping-phinf.pstatic.net/main_8687841/86878417137.8.jpg\",\"lprice\":\"10490\",\"hprice\":\"\",\"mallName\":\"티에스shop\",\"productId\":\"86878417137\",\"productType\":\"2\",\"brand\":\"순수한면\",\"maker\":\"깨끗한나라\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생리대\",\"category4\":\"일반생리대\"},{\"title\":\"언더스코어 젠틀맨 프리미엄 차량용 방향제 블랙체리, 8.2g, 1개\",\"link\":\"https://search.shopping.naver.com/catalog/53547335449\",\"image\":\"https://shopping-phinf.pstatic.net/main_5354733/53547335449.20250314114802.jpg\",\"lprice\":\"29000\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53547335449\",\"productType\":\"1\",\"brand\":\"언더스코어\",\"maker\":\"언더스코어\",\"category1\":\"생활/건강\",\"category2\":\"자동차용품\",\"category3\":\"공기청정용품\",\"category4\":\"차량용방향제\"},{\"title\":\"1+1 살림백서 곰팡이 제거제 제거 벽지 베란다 벽 화장실 욕실 실리콘 젤 뿌리는 세제\",\"link\":\"https://smartstore.naver.com/main/products/4440069322\",\"image\":\"https://shopping-phinf.pstatic.net/main_8198459/81984592030.7.jpg\",\"lprice\":\"10900\",\"hprice\":\"\",\"mallName\":\"살림백서\",\"productId\":\"81984592030\",\"productType\":\"2\",\"brand\":\"살림백서\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"세제/세정제\",\"category4\":\"곰팡이제거제\"},{\"title\":\"큐브캠 2.0 FHD 초소형 카메라 가정용 소형 무선 CCTV 적외선 홈캠 펫캠\",\"link\":\"https://smartstore.naver.com/main/products/5219618783\",\"image\":\"https://shopping-phinf.pstatic.net/main_8276414/82764140753.2.jpg\",\"lprice\":\"29800\",\"hprice\":\"\",\"mallName\":\"원캠\",\"productId\":\"82764140753\",\"productType\":\"2\",\"brand\":\"원캠\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"보안용품\",\"category4\":\"CCTV\"},{\"title\":\"암웨이치약 200gx4개 한국암웨이 오랄케어\",\"link\":\"https://smartstore.naver.com/main/products/8722398377\",\"image\":\"https://shopping-phinf.pstatic.net/main_8626689/86266898700.2.jpg\",\"lprice\":\"26400\",\"hprice\":\"\",\"mallName\":\"뷰티스타2\",\"productId\":\"86266898700\",\"productType\":\"2\",\"brand\":\"암웨이\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"구강위생용품\",\"category3\":\"치약\",\"category4\":\"\"},{\"title\":\"홈매트 리퀴드 리필 무향 제로 액체 액상 전자모기향 모기약\",\"link\":\"https://smartstore.naver.com/main/products/10191083845\",\"image\":\"https://shopping-phinf.pstatic.net/main_8773558/87735587292.7.jpg\",\"lprice\":\"17300\",\"hprice\":\"\",\"mallName\":\"코스트코이케아\",\"productId\":\"87735587292\",\"productType\":\"2\",\"brand\":\"홈매트\",\"maker\":\"헨켈\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"해충퇴치용품\",\"category4\":\"리퀴드\"},{\"title\":\"알칼리세탁세제 땀냄새제거 3L 4개 드럼세탁기 통돌이 빨래냄새제거\",\"link\":\"https://smartstore.naver.com/main/products/6052431889\",\"image\":\"https://shopping-phinf.pstatic.net/main_8359693/83596931377.4.jpg\",\"lprice\":\"23900\",\"hprice\":\"\",\"mallName\":\"기웅생활건강\",\"productId\":\"83596931377\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"세제/세정제\",\"category4\":\"세탁세제\"},{\"title\":\"액츠 세탁세제 실내건조용기 2개 중성세제 일반드럼겸용 고농축 통돌이\",\"link\":\"https://smartstore.naver.com/main/products/8140558953\",\"image\":\"https://shopping-phinf.pstatic.net/main_8568505/85685059276.10.jpg\",\"lprice\":\"13900\",\"hprice\":\"\",\"mallName\":\"티에스shop\",\"productId\":\"85685059276\",\"productType\":\"2\",\"brand\":\"액츠\",\"maker\":\"피죤\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"세제/세정제\",\"category4\":\"세탁세제\"},{\"title\":\"현관문 방화문 KAN -자 기본형 K630 도어클로저 도어체크 목문 방문 자동문닫힘\",\"link\":\"https://smartstore.naver.com/main/products/250818283\",\"image\":\"https://shopping-phinf.pstatic.net/main_7998282/7998282605.14.jpg\",\"lprice\":\"12000\",\"hprice\":\"\",\"mallName\":\"씨엘\",\"productId\":\"7998282605\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"보안용품\",\"category4\":\"도어락/안전고리\"},{\"title\":\"국가검정품 ABC 분말소화기 3.3kg 가정용 업소용 사무실용 수입\",\"link\":\"https://smartstore.naver.com/main/products/256430566\",\"image\":\"https://shopping-phinf.pstatic.net/main_1149517/11495170654.21.jpg\",\"lprice\":\"15500\",\"hprice\":\"\",\"mallName\":\"한국소방공사\",\"productId\":\"11495170654\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"공구\",\"category3\":\"안전용품\",\"category4\":\"소화기\"},{\"title\":\"그릭홀릭 유청분리기 꾸덕 그릭요거트메이커 야채탈수기 짤순이 다이어트\",\"link\":\"https://smartstore.naver.com/main/products/9274820534\",\"image\":\"https://shopping-phinf.pstatic.net/main_8681932/86819320857.2.jpg\",\"lprice\":\"15900\",\"hprice\":\"\",\"mallName\":\"Greek Holic\",\"productId\":\"86819320857\",\"productType\":\"2\",\"brand\":\"그릭홀릭\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"주방용품\",\"category3\":\"조리기구\",\"category4\":\"기타조리기구\"},{\"title\":\"다우니 대용량 섬유유연제 8.5L + 브레프 파워 액티브 변기세정제 1p\",\"link\":\"https://smartstore.naver.com/main/products/10325709315\",\"image\":\"https://shopping-phinf.pstatic.net/main_8787021/87870213517.2.jpg\",\"lprice\":\"20700\",\"hprice\":\"\",\"mallName\":\"지엑스몰\",\"productId\":\"87870213517\",\"productType\":\"2\",\"brand\":\"다우니\",\"maker\":\"P&G\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"섬유유연제\",\"category4\":\"고농축섬유유연제\"},{\"title\":\"스탠리 591 텀블러 퀜처 H2.0 플로우스테이트 차량용 텀블러\",\"link\":\"https://smartstore.naver.com/main/products/10205968585\",\"image\":\"https://shopping-phinf.pstatic.net/main_8775047/87750472093.2.jpg\",\"lprice\":\"39000\",\"hprice\":\"\",\"mallName\":\"치포마켓\",\"productId\":\"87750472093\",\"productType\":\"2\",\"brand\":\"스탠리\",\"maker\":\"스탠리\",\"category1\":\"생활/건강\",\"category2\":\"주방용품\",\"category3\":\"잔/컵\",\"category4\":\"텀블러\"},{\"title\":\"[썸머패드 증정] 좋은느낌 썸머 입는 오버나이트 8매 X 3팩 / 입는 생리대\",\"link\":\"https://smartstore.naver.com/main/products/10129386910\",\"image\":\"https://shopping-phinf.pstatic.net/main_8767388/87673889854.16.jpg\",\"lprice\":\"24900\",\"hprice\":\"\",\"mallName\":\"좋은느낌 스토어\",\"productId\":\"87673889854\",\"productType\":\"2\",\"brand\":\"좋은느낌\",\"maker\":\"유한킴벌리\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생리대\",\"category4\":\"일반생리대\"},{\"title\":\"두꺼운 고급 무지쇼핑백 종이쇼핑백 주문제작 소량 로고인쇄 선물용 종이가방 세로형1호\",\"link\":\"https://smartstore.naver.com/main/products/8643964296\",\"image\":\"https://shopping-phinf.pstatic.net/main_8618846/86188464619.14.jpg\",\"lprice\":\"350\",\"hprice\":\"\",\"mallName\":\"세모쇼핑백\",\"productId\":\"86188464619\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"쇼핑백\"},{\"title\":\"아스토니쉬 5분 욕실청소 2종 세트 (곰팡이제거제+배스룸클리너)\",\"link\":\"https://smartstore.naver.com/main/products/8529119715\",\"image\":\"https://shopping-phinf.pstatic.net/main_8607362/86073620038.3.jpg\",\"lprice\":\"23040\",\"hprice\":\"\",\"mallName\":\"아스토니쉬\",\"productId\":\"86073620038\",\"productType\":\"2\",\"brand\":\"아스토니쉬\",\"maker\":\"런던오일리파이닝\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"세제/세정제\",\"category4\":\"곰팡이제거제\"},{\"title\":\"컴배트 좀벌레싹 허브 옷장 6개입 퇴치제 약\",\"link\":\"https://smartstore.naver.com/main/products/130681093\",\"image\":\"https://shopping-phinf.pstatic.net/main_6811953/6811953254.14.jpg\",\"lprice\":\"9500\",\"hprice\":\"\",\"mallName\":\"예스유통\",\"productId\":\"6811953254\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"해충퇴치용품\",\"category4\":\"방충제\"},{\"title\":\"방충망 탈부착 자석 미세먼지 모기장 창문 설치 DIY 셀프시공 소프트 자석쫄대 3M\",\"link\":\"https://smartstore.naver.com/main/products/9901819508\",\"image\":\"https://shopping-phinf.pstatic.net/main_8744632/87446321781.1.jpg\",\"lprice\":\"6500\",\"hprice\":\"\",\"mallName\":\"한반도철망\",\"productId\":\"87446321781\",\"productType\":\"2\",\"brand\":\"한반도철망\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"모기장\"},{\"title\":\"최근생산 롯데정밀화학 유록스 요소수10L 1개 자바라포함\",\"link\":\"https://smartstore.naver.com/main/products/9559248305\",\"image\":\"https://shopping-phinf.pstatic.net/main_8710375/87103750575.4.jpg\",\"lprice\":\"6250\",\"hprice\":\"\",\"mallName\":\"정품정량\",\"productId\":\"87103750575\",\"productType\":\"2\",\"brand\":\"유록스\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"자동차용품\",\"category3\":\"오일/소모품\",\"category4\":\"요소수\"},{\"title\":\"제거죠스 미생물 효소 배수구 클리너 싱크대 하수구 냄새 제거 세정제\",\"link\":\"https://smartstore.naver.com/main/products/10780688049\",\"image\":\"https://shopping-phinf.pstatic.net/main_8832519/88325194039.1.jpg\",\"lprice\":\"18900\",\"hprice\":\"\",\"mallName\":\"제거죠스\",\"productId\":\"88325194039\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"세제/세정제\",\"category4\":\"배수구세정제\"},{\"title\":\"현대 국산 멀티탭 개별 과부하차단 16A 4구 1.5M 안전 접지 스위치 멀티 콘센트\",\"link\":\"https://smartstore.naver.com/main/products/11057381668\",\"image\":\"https://shopping-phinf.pstatic.net/main_8860188/88601887879.jpg\",\"lprice\":\"9700\",\"hprice\":\"\",\"mallName\":\"현대멀티탭스토어\",\"productId\":\"88601887879\",\"productType\":\"2\",\"brand\":\"현대\",\"maker\":\"현대일렉트릭\",\"category1\":\"생활/건강\",\"category2\":\"공구\",\"category3\":\"전기용품\",\"category4\":\"멀티탭\"},{\"title\":\"올리 센서휴지통 스마트쓰레기통 자동센서 미니 대형 12L 16L 1+1\",\"link\":\"https://smartstore.naver.com/main/products/9771054163\",\"image\":\"https://shopping-phinf.pstatic.net/main_8731555/87315556436.4.jpg\",\"lprice\":\"29900\",\"hprice\":\"\",\"mallName\":\"올리 OLLY\",\"productId\":\"87315556436\",\"productType\":\"2\",\"brand\":\"OLLY\",\"maker\":\"에어로코리아\",\"category1\":\"생활/건강\",\"category2\":\"청소용품\",\"category3\":\"휴지통\",\"category4\":\"다용도휴지통\"},{\"title\":\"위프 탈취제 WHIFF 화장실 담배 새집증후군 홀애비 소변기 초강력 냄새 제거\",\"link\":\"https://smartstore.naver.com/main/products/11530520013\",\"image\":\"https://shopping-phinf.pstatic.net/main_8907503/89075030419.jpg\",\"lprice\":\"21900\",\"hprice\":\"\",\"mallName\":\"위프라이프\",\"productId\":\"89075030419\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"제습/방향/탈취\",\"category4\":\"실내탈취제\"},{\"title\":\"땡큐 순수 천연펄프 3겹 14m, 30롤, 1팩\",\"link\":\"https://search.shopping.naver.com/catalog/54647347924\",\"image\":\"https://shopping-phinf.pstatic.net/main_5464734/54647347924.20250508140616.jpg\",\"lprice\":\"4990\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"54647347924\",\"productType\":\"1\",\"brand\":\"땡큐\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"화장지\",\"category4\":\"롤화장지\"},{\"title\":\"국산 모기장 대형모기장 침대 야외 사각모기장 화이트10인용\",\"link\":\"https://smartstore.naver.com/main/products/2651807250\",\"image\":\"https://shopping-phinf.pstatic.net/main_8014955/80149550922.19.jpg\",\"lprice\":\"19200\",\"hprice\":\"\",\"mallName\":\"닛시스타일\",\"productId\":\"80149550922\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"모기장\"},{\"title\":\"바퀴벌레약 바이엘 맥스포스셀렉트 이지겔 20g\",\"link\":\"https://smartstore.naver.com/main/products/2756843543\",\"image\":\"https://shopping-phinf.pstatic.net/main_8025458/80254587290.2.jpg\",\"lprice\":\"11000\",\"hprice\":\"\",\"mallName\":\"벌레특공대\",\"productId\":\"80254587290\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"해충퇴치용품\",\"category4\":\"겔\"},{\"title\":\"현관문고무패킹 문틈막이 방화문가스켓 현관 우풍 소음 벌레 외풍차단 틈새막이 방음재 일반형\",\"link\":\"https://smartstore.naver.com/main/products/4976480580\",\"image\":\"https://shopping-phinf.pstatic.net/main_8252100/82521000904.2.jpg\",\"lprice\":\"1390\",\"hprice\":\"\",\"mallName\":\"나라종합\",\"productId\":\"82521000904\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"문풍지\"},{\"title\":\"살림백서 딥클린 트리플 액션 고농축 캡슐세제 100개입, 1개\",\"link\":\"https://search.shopping.naver.com/catalog/53191833757\",\"image\":\"https://shopping-phinf.pstatic.net/main_5319183/53191833757.20250224165636.jpg\",\"lprice\":\"19900\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53191833757\",\"productType\":\"1\",\"brand\":\"살림백서\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"세제/세정제\",\"category4\":\"세탁세제\"},{\"title\":\"살림백서 보들보들 각티슈 미용티슈 250매 6개입 곽휴지 곽티슈\",\"link\":\"https://smartstore.naver.com/main/products/5043187023\",\"image\":\"https://shopping-phinf.pstatic.net/main_8258770/82587708083.2.jpg\",\"lprice\":\"11900\",\"hprice\":\"\",\"mallName\":\"살림백서\",\"productId\":\"82587708083\",\"productType\":\"2\",\"brand\":\"살림백서\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"화장지\",\"category4\":\"갑티슈\"},{\"title\":\"돗자리 피크닉매트 방수 감성 휴대용 소풍 양면 비치 한강 세트 야외 대형\",\"link\":\"https://smartstore.naver.com/main/products/5882065887\",\"image\":\"https://shopping-phinf.pstatic.net/main_8342656/83426565301.19.jpg\",\"lprice\":\"12900\",\"hprice\":\"\",\"mallName\":\"더캠핑\",\"productId\":\"83426565301\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"돗자리/매트\"},{\"title\":\"엑스포트 A4용지 75g 2500매, 1개\",\"link\":\"https://search.shopping.naver.com/catalog/51929189596\",\"image\":\"https://shopping-phinf.pstatic.net/main_5192918/51929189596.20241213205230.jpg\",\"lprice\":\"15070\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"51929189596\",\"productType\":\"1\",\"brand\":\"엑스포트\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"문구/사무용품\",\"category3\":\"용지\",\"category4\":\"복사지\"},{\"title\":\"화분 대형 거실 플라스틱 인테리어화분 세로플리츠 2647 화이트\",\"link\":\"https://smartstore.naver.com/main/products/2489117355\",\"image\":\"https://shopping-phinf.pstatic.net/main_1348596/13485962768.14.jpg\",\"lprice\":\"33800\",\"hprice\":\"\",\"mallName\":\"밍이네가든\",\"productId\":\"13485962768\",\"productType\":\"2\",\"brand\":\"밍이네가든\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"정원/원예용품\",\"category3\":\"화분\",\"category4\":\"\"},{\"title\":\"크린센스 점보롤 물에잘녹는 뉴욕 엠보싱 300 100m(2겹)x8롤 대용량 업소용 휴지\",\"link\":\"https://smartstore.naver.com/main/products/216843370\",\"image\":\"https://shopping-phinf.pstatic.net/main_7504738/7504738662.4.jpg\",\"lprice\":\"12900\",\"hprice\":\"\",\"mallName\":\"브리즈\",\"productId\":\"7504738662\",\"productType\":\"2\",\"brand\":\"크린센스\",\"maker\":\"동성인터내쇼날\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"화장지\",\"category4\":\"점보롤\"},{\"title\":\"샷시 풍지판 창문 바람막이 베란다 문 틈막이 창틀 벌레 차단 샤시 방충망 틈새막이\",\"link\":\"https://smartstore.naver.com/main/products/9396357056\",\"image\":\"https://shopping-phinf.pstatic.net/main_8694085/86940857379.1.jpg\",\"lprice\":\"230\",\"hprice\":\"\",\"mallName\":\"EASYWAY\",\"productId\":\"86940857379\",\"productType\":\"2\",\"brand\":\"이지웨이건축자재\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생활잡화\",\"category4\":\"문풍지\"},{\"title\":\"[매일출발]유로블루플러스 차량용 요소수 국내산 Adblue 호스포함\",\"link\":\"https://smartstore.naver.com/main/products/10299892253\",\"image\":\"https://shopping-phinf.pstatic.net/main_8784439/87844396267.17.jpg\",\"lprice\":\"8700\",\"hprice\":\"\",\"mallName\":\"유로블루플러스\",\"productId\":\"87844396267\",\"productType\":\"2\",\"brand\":\"유로블루플러스\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"자동차용품\",\"category3\":\"오일/소모품\",\"category4\":\"요소수\"},{\"title\":\"에이스컴즈맥세이프 차량용 휴대폰 거치대 자석 대시보드 아이폰 아이패드 태블릿마그네틱 갤럭시\",\"link\":\"https://smartstore.naver.com/main/products/8362734879\",\"image\":\"https://shopping-phinf.pstatic.net/main_8590723/85907235202.9.jpg\",\"lprice\":\"27900\",\"hprice\":\"\",\"mallName\":\"에이스컴즈\",\"productId\":\"85907235202\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"자동차용품\",\"category3\":\"휴대폰용품\",\"category4\":\"차량용휴대폰거치대\"},{\"title\":\"[팝마트] 스컬판다 겨울 교향곡 시리즈 인형 키링 / 랜덤피규어\",\"link\":\"https://smartstore.naver.com/main/products/11236456326\",\"image\":\"https://shopping-phinf.pstatic.net/main_8878096/88780966657.jpg\",\"lprice\":\"28000\",\"hprice\":\"\",\"mallName\":\"팝마트코리아 공식 스토어\",\"productId\":\"88780966657\",\"productType\":\"2\",\"brand\":\"팝마트\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"수집품\",\"category3\":\"모형/프라모델/피규어\",\"category4\":\"피규어\"},{\"title\":\"자동차 TPE 카매트 차량용 바닥매트 3D 풀커버 BS-04 2륜\",\"link\":\"https://smartstore.naver.com/main/products/7598986439\",\"image\":\"https://shopping-phinf.pstatic.net/main_8514348/85143486761.3.jpg\",\"lprice\":\"98000\",\"hprice\":\"\",\"mallName\":\"유투카\",\"productId\":\"85143486761\",\"productType\":\"2\",\"brand\":\"유투카\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"자동차용품\",\"category3\":\"인테리어용품\",\"category4\":\"바닥매트\"},{\"title\":\"딥디크 차량용 방향제 베이 세트 (케이스+리필용 캡슐)\",\"link\":\"https://smartstore.naver.com/main/products/8199629704\",\"image\":\"https://shopping-phinf.pstatic.net/main_8574413/85744130027.2.jpg\",\"lprice\":\"73500\",\"hprice\":\"\",\"mallName\":\"황가네 장터\",\"productId\":\"85744130027\",\"productType\":\"2\",\"brand\":\"딥티크\",\"maker\":\"딥티크\",\"category1\":\"생활/건강\",\"category2\":\"자동차용품\",\"category3\":\"공기청정용품\",\"category4\":\"차량용방향제\"},{\"title\":\"캠핑슬립 라이트 SUV 차박매트 트렁크 매트리스 차량용 평탄화 차박용품 엠보그레이\",\"link\":\"https://smartstore.naver.com/main/products/5960280549\",\"image\":\"https://shopping-phinf.pstatic.net/main_8350478/83504780037.7.jpg\",\"lprice\":\"139000\",\"hprice\":\"\",\"mallName\":\"캠핑슬립\",\"productId\":\"83504780037\",\"productType\":\"2\",\"brand\":\"캠핑슬립\",\"maker\":\"꼬메벨로\",\"category1\":\"생활/건강\",\"category2\":\"자동차용품\",\"category3\":\"인테리어용품\",\"category4\":\"바닥매트\"},{\"title\":\"에이스라이프 대림바스 필터없는 에어버블 방수 비데 DDS-S150A 자가설치\",\"link\":\"https://search.shopping.naver.com/catalog/53786242417\",\"image\":\"https://shopping-phinf.pstatic.net/main_5378624/53786242417.20250326120451.jpg\",\"lprice\":\"186850\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53786242417\",\"productType\":\"1\",\"brand\":\"대림바스\",\"maker\":\"에이스라이프\",\"category1\":\"생활/건강\",\"category2\":\"욕실용품\",\"category3\":\"비데/비데용품\",\"category4\":\"전자식비데\"},{\"title\":\"국산 고용량 멀티탭 안전 접지 대용량 건조기 에어컨 전용 2구 1m\",\"link\":\"https://smartstore.naver.com/main/products/7489457007\",\"image\":\"https://shopping-phinf.pstatic.net/main_8503395/85033957329.7.jpg\",\"lprice\":\"12600\",\"hprice\":\"\",\"mallName\":\"스윗홈 스토어\",\"productId\":\"85033957329\",\"productType\":\"2\",\"brand\":\"스윗홈\",\"maker\":\"스윗홈\",\"category1\":\"생활/건강\",\"category2\":\"공구\",\"category3\":\"전기용품\",\"category4\":\"멀티탭\"},{\"title\":\"하수구트랩 배수구 냄새제거 차단 화장실 욕실 40-99mm\",\"link\":\"https://smartstore.naver.com/main/products/5008920074\",\"image\":\"https://shopping-phinf.pstatic.net/main_8255344/82553440741.14.jpg\",\"lprice\":\"4000\",\"hprice\":\"\",\"mallName\":\"낭만 탐구소\",\"productId\":\"82553440741\",\"productType\":\"2\",\"brand\":\"낭만탐구소\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"욕실용품\",\"category3\":\"샤워기/수전용품\",\"category4\":\"배수구캡\"},{\"title\":\"다우니 향수 컬렉션 초고농축 섬유유연제 5종 패밀리팩 본품 1L 5개\",\"link\":\"https://smartstore.naver.com/main/products/6506976689\",\"image\":\"https://shopping-phinf.pstatic.net/main_8405147/84051477022.65.jpg\",\"lprice\":\"29900\",\"hprice\":\"\",\"mallName\":\"다우니페브리즈공식몰\",\"productId\":\"84051477022\",\"productType\":\"2\",\"brand\":\"다우니\",\"maker\":\"P&G\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"섬유유연제\",\"category4\":\"고농축섬유유연제\"},{\"title\":\"피지 모락셀라 운동복 땀냄새제거 스포츠세제 빨래쉰내 스포츠의류 실내건조 일반드럼 겸용 1.5L 1개+액체세제 70ml 2개\",\"link\":\"https://smartstore.naver.com/main/products/11745635994\",\"image\":\"https://shopping-phinf.pstatic.net/main_8929014/89290146513.8.jpg\",\"lprice\":\"11500\",\"hprice\":\"\",\"mallName\":\"LG생활건강 공식 스토어\",\"productId\":\"89290146513\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"세제/세정제\",\"category4\":\"세탁세제\"},{\"title\":\"물먹는하마 옷장용300g (물부피525ml) 제습제 냄새먹는하마 8개입, 3개\",\"link\":\"https://smartstore.naver.com/main/products/11662326588\",\"image\":\"https://shopping-phinf.pstatic.net/main_8920683/89206837055.jpg\",\"lprice\":\"35900\",\"hprice\":\"\",\"mallName\":\"조아나라\",\"productId\":\"89206837055\",\"productType\":\"2\",\"brand\":\"물먹는하마\",\"maker\":\"옥시레킷벤키저\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"제습/방향/탈취\",\"category4\":\"제습제\"},{\"title\":\"안깨지는 세이프티어항 거북이 물고기 열대어 금붕어 구피 키우기 아크릴 수족관 중형 화이트\",\"link\":\"https://smartstore.naver.com/main/products/7536429618\",\"image\":\"https://shopping-phinf.pstatic.net/main_8508092/85080929940.3.jpg\",\"lprice\":\"25860\",\"hprice\":\"\",\"mallName\":\"물고기입니다만\",\"productId\":\"85080929940\",\"productType\":\"2\",\"brand\":\"페이토\",\"maker\":\"페이토코리아\",\"category1\":\"생활/건강\",\"category2\":\"관상어용품\",\"category3\":\"수족관/어항\",\"category4\":\"\"},{\"title\":\"카포드 듀얼코어 캡슐세제 브라이트닝 35개입+파워플러스 35개입,향기부스터 10g x2개\",\"link\":\"https://smartstore.naver.com/main/products/5107921535\",\"image\":\"https://shopping-phinf.pstatic.net/main_8265244/82652443581.109.jpg\",\"lprice\":\"39900\",\"hprice\":\"\",\"mallName\":\"웰스로만센트라린\",\"productId\":\"82652443581\",\"productType\":\"2\",\"brand\":\"카포드\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"세제/세정제\",\"category4\":\"세탁세제\"},{\"title\":\"하비비 청개구리 변기클리너 120g, 6개\",\"link\":\"https://search.shopping.naver.com/catalog/52249568626\",\"image\":\"https://shopping-phinf.pstatic.net/main_5224956/52249568626.20250403100046.jpg\",\"lprice\":\"17900\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"52249568626\",\"productType\":\"1\",\"brand\":\"하비비\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"세제/세정제\",\"category4\":\"변기세정제\"},{\"title\":\"국산 개별 스위치 과부하차단 4구 1m 멀티 콘센트 안전 접지 슬림 멀티탭\",\"link\":\"https://smartstore.naver.com/main/products/5878545801\",\"image\":\"https://shopping-phinf.pstatic.net/main_8342304/83423045215.15.jpg\",\"lprice\":\"7900\",\"hprice\":\"\",\"mallName\":\"스윗홈 스토어\",\"productId\":\"83423045215\",\"productType\":\"2\",\"brand\":\"스윗홈\",\"maker\":\"스윗홈\",\"category1\":\"생활/건강\",\"category2\":\"공구\",\"category3\":\"전기용품\",\"category4\":\"멀티탭\"},{\"title\":\"선일금고 루셀 지문인식 메타셀 내화금고 MC-ID40\",\"link\":\"https://search.shopping.naver.com/catalog/40617685882\",\"image\":\"https://shopping-phinf.pstatic.net/main_4061768/40617685882.20230726101246.jpg\",\"lprice\":\"598000\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"40617685882\",\"productType\":\"1\",\"brand\":\"\",\"maker\":\"선일금고\",\"category1\":\"생활/건강\",\"category2\":\"문구/사무용품\",\"category3\":\"사무기기\",\"category4\":\"금고\"},{\"title\":\"오픈형 폴딩박스 리빙박스 56L 투명 옷정리함 옷장 수납함\",\"link\":\"https://smartstore.naver.com/main/products/5403419056\",\"image\":\"https://shopping-phinf.pstatic.net/main_8294791/82947912717.4.jpg\",\"lprice\":\"13800\",\"hprice\":\"\",\"mallName\":\"낭만 탐구소\",\"productId\":\"82947912717\",\"productType\":\"2\",\"brand\":\"낭만탐구소\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"수납/정리용품\",\"category3\":\"정리함\",\"category4\":\"소품정리함\"},{\"title\":\"올챌린지 도톰한 3겹 뽑아쓰는 키친타올 100매 4개+4개+1개 100%천연펄프\",\"link\":\"https://smartstore.naver.com/main/products/6631785129\",\"image\":\"https://shopping-phinf.pstatic.net/main_8417628/84176285451.18.jpg\",\"lprice\":\"10000\",\"hprice\":\"\",\"mallName\":\"올챌린지\",\"productId\":\"84176285451\",\"productType\":\"2\",\"brand\":\"올챌린지\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"화장지\",\"category4\":\"키친타월\"},{\"title\":\"스웰데이 투웨이 쿠션 막대걸레 물걸레 밀대걸레 호환 밀대\",\"link\":\"https://smartstore.naver.com/main/products/9454752218\",\"image\":\"https://shopping-phinf.pstatic.net/main_8699925/86999252541.8.jpg\",\"lprice\":\"12900\",\"hprice\":\"\",\"mallName\":\"스웰데이\",\"productId\":\"86999252541\",\"productType\":\"2\",\"brand\":\"스웰데이\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"청소용품\",\"category3\":\"밀대/패드\",\"category4\":\"\"},{\"title\":\"유한킴벌리 좋은느낌 에어핏쿠션 슈퍼롱 오버나이트, 20개입, 1팩\",\"link\":\"https://search.shopping.naver.com/catalog/52818475675\",\"image\":\"https://shopping-phinf.pstatic.net/main_5281847/52818475675.20250205120235.jpg\",\"lprice\":\"6250\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"52818475675\",\"productType\":\"1\",\"brand\":\"좋은느낌\",\"maker\":\"유한킴벌리\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"생리대\",\"category4\":\"일반생리대\"},{\"title\":\"[옵션] 테팔 인덕션 티타늄 1X 스테인리스 스틸 에센스쿡 프라이팬 20cm\",\"link\":\"https://smartstore.naver.com/main/products/5489216369\",\"image\":\"https://shopping-phinf.pstatic.net/main_8303371/83033711411.25.jpg\",\"lprice\":\"28000\",\"hprice\":\"\",\"mallName\":\"테팔\",\"productId\":\"83033711411\",\"productType\":\"2\",\"brand\":\"테팔\",\"maker\":\"테팔\",\"category1\":\"생활/건강\",\"category2\":\"주방용품\",\"category3\":\"프라이팬\",\"category4\":\"일반프라이팬\"},{\"title\":\"나노 아트2 전기 매립 콘센트 커버 2구\",\"link\":\"https://smartstore.naver.com/main/products/7170895087\",\"image\":\"https://shopping-phinf.pstatic.net/main_8471539/84715395409.1.jpg\",\"lprice\":\"2500\",\"hprice\":\"\",\"mallName\":\"터치전기\",\"productId\":\"84715395409\",\"productType\":\"2\",\"brand\":\"나노\",\"maker\":\"나노\",\"category1\":\"생활/건강\",\"category2\":\"공구\",\"category3\":\"전기용품\",\"category4\":\"기타 전기용품\"},{\"title\":\"P&amp;G 다우니 울트라 섬유유연제 에이프릴 프레쉬, 5.03L, 1개\",\"link\":\"https://search.shopping.naver.com/catalog/53546567170\",\"image\":\"https://shopping-phinf.pstatic.net/main_5354656/53546567170.20250314103924.jpg\",\"lprice\":\"16610\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53546567170\",\"productType\":\"1\",\"brand\":\"다우니\",\"maker\":\"P&G\",\"category1\":\"생활/건강\",\"category2\":\"생활용품\",\"category3\":\"섬유유연제\",\"category4\":\"고농축섬유유연제\"},{\"title\":\"바비온 슬리커 자동 털제거 빗 쓱싹 핀 브러쉬 112ZR 오렌지, M\",\"link\":\"https://search.shopping.naver.com/catalog/53663904900\",\"image\":\"https://shopping-phinf.pstatic.net/main_5366390/53663904900.20250320100513.jpg\",\"lprice\":\"15900\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53663904900\",\"productType\":\"1\",\"brand\":\"바비온\",\"maker\":\"바비온\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"미용/목욕\",\"category4\":\"브러시/빗\"},{\"title\":\"카스테라 강아지 방석 고양이 마약쿠션 커버분리 코스트코 켄넬 대형 대형견 방석 M\",\"link\":\"https://smartstore.naver.com/main/products/7223807949\",\"image\":\"https://shopping-phinf.pstatic.net/main_8476830/84768308271.11.jpg\",\"lprice\":\"24900\",\"hprice\":\"\",\"mallName\":\"킁킁펫\",\"productId\":\"84768308271\",\"productType\":\"2\",\"brand\":\"킁킁펫\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"쿠션/방석\"},{\"title\":\"가르르 오로라 캣타워 고양이 캣폴 알루미늄+삼줄기둥 일반세트\",\"link\":\"https://smartstore.naver.com/main/products/8406568596\",\"image\":\"https://shopping-phinf.pstatic.net/main_8595106/85951068919.43.jpg\",\"lprice\":\"230000\",\"hprice\":\"\",\"mallName\":\"가르르\",\"productId\":\"85951068919\",\"productType\":\"2\",\"brand\":\"가르르\",\"maker\":\"가르르\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"캣타워/스크래쳐\",\"category4\":\"캣타워/캣폴\"},{\"title\":\"스타일러그 강아지매트 고양이 애견 미끄럼방지 펫 반려견 카페트 바닥 방수 러그 거실\",\"link\":\"https://search.shopping.naver.com/catalog/53705940330\",\"image\":\"https://shopping-phinf.pstatic.net/main_5370594/53705940330.20250404094459.jpg\",\"lprice\":\"18900\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53705940330\",\"productType\":\"1\",\"brand\":\"스타일러그\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"매트\"},{\"title\":\"LUAZ 강아지 밥그릇 물그릇 고양이 식기 물통 LUAZ-DW01\",\"link\":\"https://search.shopping.naver.com/catalog/36321905955\",\"image\":\"https://shopping-phinf.pstatic.net/main_3632190/36321905955.20240331031626.jpg\",\"lprice\":\"8500\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"36321905955\",\"productType\":\"1\",\"brand\":\"LUAZ\",\"maker\":\"루아즈\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"식기/급수기\",\"category4\":\"식기/식탁\"},{\"title\":\"토마고 강아지 고양이 바리깡 미니 미용기 발 부분 털 발털 클리퍼 발바닥 이발기 화이트\",\"link\":\"https://smartstore.naver.com/main/products/2184526789\",\"image\":\"https://shopping-phinf.pstatic.net/main_1228498/12284980671.36.jpg\",\"lprice\":\"24800\",\"hprice\":\"\",\"mallName\":\"펫방앗간\",\"productId\":\"12284980671\",\"productType\":\"2\",\"brand\":\"토마고\",\"maker\":\"케이엘테크\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"미용/목욕\",\"category4\":\"이발기\"},{\"title\":\"강아지 고양이 숨숨집 하우스 텐트 실외 길냥이 길고양이 집 플라스틱 개집\",\"link\":\"https://smartstore.naver.com/main/products/10037143546\",\"image\":\"https://shopping-phinf.pstatic.net/main_8758164/87581646050.jpg\",\"lprice\":\"35900\",\"hprice\":\"\",\"mallName\":\"미우프\",\"productId\":\"87581646050\",\"productType\":\"2\",\"brand\":\"UNKNOWN\",\"maker\":\"UNKNOWN\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"하우스\"},{\"title\":\"실리어스 푸우형 실리콘 강아지매트, 미끄럼방지 애견 롤매트 펫 러그 140x100cm\",\"link\":\"https://smartstore.naver.com/main/products/8719169350\",\"image\":\"https://shopping-phinf.pstatic.net/main_8626366/86263669673.1.jpg\",\"lprice\":\"83000\",\"hprice\":\"\",\"mallName\":\"실리어스\",\"productId\":\"86263669673\",\"productType\":\"2\",\"brand\":\"실리어스\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"매트\"},{\"title\":\"사롬사리 강아지 쿨매트 고양이 애견 여름 냉감 패드\",\"link\":\"https://search.shopping.naver.com/catalog/53670171320\",\"image\":\"https://shopping-phinf.pstatic.net/main_5367017/53670171320.20250408070603.jpg\",\"lprice\":\"18500\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53670171320\",\"productType\":\"1\",\"brand\":\"사롬사리\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"매트\"},{\"title\":\"[세이버 퐁고 2.0] 펫드라이룸 중형견케어 강아지 고양이 간편 털말리기 애견 애묘 건조기\",\"link\":\"https://smartstore.naver.com/main/products/11102041334\",\"image\":\"https://shopping-phinf.pstatic.net/main_8864655/88646551656.5.jpg\",\"lprice\":\"1190000\",\"hprice\":\"\",\"mallName\":\"세이버 공식몰\",\"productId\":\"88646551656\",\"productType\":\"2\",\"brand\":\"세이버\",\"maker\":\"세이버\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"미용/목욕\",\"category4\":\"드라이기/드라이룸\"},{\"title\":\"멍묘인 강아지 2.0텐트 M 집 고양이 숨숨집 예쁜 하우스 개 애견 방석 없음\",\"link\":\"https://smartstore.naver.com/main/products/5776179111\",\"image\":\"https://shopping-phinf.pstatic.net/main_8332067/83320678525.4.jpg\",\"lprice\":\"22900\",\"hprice\":\"\",\"mallName\":\"멍묘인\",\"productId\":\"83320678525\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"하우스\"},{\"title\":\"LUAZ 애견 강아지 방석 고양이 쿠션 담요 이불 LUAZ-DG6\",\"link\":\"https://search.shopping.naver.com/catalog/54279064807\",\"image\":\"https://shopping-phinf.pstatic.net/main_5427906/54279064807.20250502103826.jpg\",\"lprice\":\"7500\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"54279064807\",\"productType\":\"1\",\"brand\":\"LUAZ\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"쿠션/방석\"},{\"title\":\"스니프 칠링칠링 듀라론 애견 강아지쿨매트 여름용 반려동물 쿨방석\",\"link\":\"https://search.shopping.naver.com/catalog/33242151678\",\"image\":\"https://shopping-phinf.pstatic.net/main_3324215/33242151678.20250514090745.jpg\",\"lprice\":\"18900\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"33242151678\",\"productType\":\"1\",\"brand\":\"스니프\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"매트\"},{\"title\":\"접촉냉감 누빔 강아지 쿨매트 고양이 아이스 패드 냉감 매트 M\",\"link\":\"https://smartstore.naver.com/main/products/10615040891\",\"image\":\"https://shopping-phinf.pstatic.net/main_8815954/88159546540.7.jpg\",\"lprice\":\"26800\",\"hprice\":\"\",\"mallName\":\"올웨이즈올펫\",\"productId\":\"88159546540\",\"productType\":\"2\",\"brand\":\"올웨이즈올펫\",\"maker\":\"지오위즈\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"매트\"},{\"title\":\"올웨이즈올펫 딩굴 강아지매트 고양이 미끄럼방지 슬개골예방 롤 매트 110x50x0.6cm\",\"link\":\"https://smartstore.naver.com/main/products/5311346622\",\"image\":\"https://shopping-phinf.pstatic.net/main_8285583/82855839069.40.jpg\",\"lprice\":\"10800\",\"hprice\":\"\",\"mallName\":\"올웨이즈올펫\",\"productId\":\"82855839069\",\"productType\":\"2\",\"brand\":\"올웨이즈올펫\",\"maker\":\"지오위즈\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"매트\"},{\"title\":\"비엔메이드 무드 롤 시공 강아지매트 애견 방수 미끄럼방지 고양이 매트 70cm X 0.5M\",\"link\":\"https://smartstore.naver.com/main/products/8490392547\",\"image\":\"https://shopping-phinf.pstatic.net/main_8603489/86034892870.1.jpg\",\"lprice\":\"9900\",\"hprice\":\"\",\"mallName\":\"비엔메이드\",\"productId\":\"86034892870\",\"productType\":\"2\",\"brand\":\"비엔메이드\",\"maker\":\"신영인더스\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"매트\"},{\"title\":\"가티가티 고양이식기 강아지밥그릇 식탁 1구식기세트 빈티지로즈\",\"link\":\"https://smartstore.naver.com/main/products/5354078062\",\"image\":\"https://shopping-phinf.pstatic.net/main_8289857/82898571031.3.jpg\",\"lprice\":\"26400\",\"hprice\":\"\",\"mallName\":\"가티몰\",\"productId\":\"82898571031\",\"productType\":\"2\",\"brand\":\"가티가티\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"식기/급수기\",\"category4\":\"식기/식탁\"},{\"title\":\"올웨이즈올펫 강아지 쿨방석 고양이 냉감 아이스 쿨쿠션 M\",\"link\":\"https://smartstore.naver.com/main/products/8501680564\",\"image\":\"https://shopping-phinf.pstatic.net/main_8604618/86046180887.10.jpg\",\"lprice\":\"49800\",\"hprice\":\"\",\"mallName\":\"올웨이즈올펫\",\"productId\":\"86046180887\",\"productType\":\"3\",\"brand\":\"펫토\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"쿠션/방석\"},{\"title\":\"슈퍼벳 레날 에이드 280mg x 60캡슐, 1개\",\"link\":\"https://search.shopping.naver.com/catalog/52539061038\",\"image\":\"https://shopping-phinf.pstatic.net/main_5253906/52539061038.20250117155343.jpg\",\"lprice\":\"28700\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"52539061038\",\"productType\":\"1\",\"brand\":\"슈퍼벳\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"강아지 건강/관리용품\",\"category4\":\"영양제\"},{\"title\":\"테일로그 탈출방지 고양이 방묘창 캣키퍼 1개 창문 높이 85\",\"link\":\"https://search.shopping.naver.com/catalog/53922016884\",\"image\":\"https://shopping-phinf.pstatic.net/main_5392201/53922016884.20250403011953.jpg\",\"lprice\":\"32000\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53922016884\",\"productType\":\"1\",\"brand\":\"테일로그\",\"maker\":\"테일로그\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"안전문\"},{\"title\":\"[케어사이드] 강아지 고양이 헤파카디오 Q10 60정 심장보조영양제 CARESIDE HEPACARDIO\",\"link\":\"https://smartstore.naver.com/main/products/7102910072\",\"image\":\"https://shopping-phinf.pstatic.net/main_8464741/84647410394.5.jpg\",\"lprice\":\"18990\",\"hprice\":\"\",\"mallName\":\"예쁘개냥\",\"productId\":\"84647410394\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"강아지 건강/관리용품\",\"category4\":\"영양제\"},{\"title\":\"접이식 강아지 고양이 해먹 침대 대형견해먹 캠핑 의자 S\",\"link\":\"https://smartstore.naver.com/main/products/5769443200\",\"image\":\"https://shopping-phinf.pstatic.net/main_8331394/83313942614.2.jpg\",\"lprice\":\"28000\",\"hprice\":\"\",\"mallName\":\"멍심사냥\",\"productId\":\"83313942614\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"침대/해먹\"},{\"title\":\"[페스룸] 네이처 이어 클리너 강아지 고양이 귀세정제 귀청소 귓병 예방\",\"link\":\"https://smartstore.naver.com/main/products/4792716744\",\"image\":\"https://shopping-phinf.pstatic.net/main_8233723/82337239241.3.jpg\",\"lprice\":\"15900\",\"hprice\":\"\",\"mallName\":\"PETHROOM\",\"productId\":\"82337239241\",\"productType\":\"2\",\"brand\":\"페스룸\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"강아지 건강/관리용품\",\"category4\":\"눈/귀 관리용품\"},{\"title\":\"키즈온더블럭 펫도어 견문 강아지 고양이 안전문 베란다 펫도어 시공 미니\",\"link\":\"https://smartstore.naver.com/main/products/7918440666\",\"image\":\"https://shopping-phinf.pstatic.net/main_8546294/85462940989.10.jpg\",\"lprice\":\"98000\",\"hprice\":\"\",\"mallName\":\"키즈온더블럭\",\"productId\":\"85462940989\",\"productType\":\"2\",\"brand\":\"키즈온더블럭\",\"maker\":\"아이작\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"안전문\"},{\"title\":\"퍼키퍼키 강아지밥그릇 고양이밥그릇 물그릇 애견 식기 높이조절 식탁 세트\",\"link\":\"https://smartstore.naver.com/main/products/10268762667\",\"image\":\"https://shopping-phinf.pstatic.net/main_8781326/87813266469.16.jpg\",\"lprice\":\"27900\",\"hprice\":\"\",\"mallName\":\"퍼키퍼키\",\"productId\":\"87813266469\",\"productType\":\"2\",\"brand\":\"퍼키퍼키\",\"maker\":\"퍼키퍼키\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"식기/급수기\",\"category4\":\"식기/식탁\"},{\"title\":\"펫테일 견분무취 200g, 1개\",\"link\":\"https://search.shopping.naver.com/catalog/51929267504\",\"image\":\"https://shopping-phinf.pstatic.net/main_5192926/51929267504.20241213211322.jpg\",\"lprice\":\"18900\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"51929267504\",\"productType\":\"1\",\"brand\":\"펫테일\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"강아지 건강/관리용품\",\"category4\":\"영양제\"},{\"title\":\"펫코본 고양이밥그릇 물그릇 강아지 1구 투명 유리 식기 수반\",\"link\":\"https://search.shopping.naver.com/catalog/51181438556\",\"image\":\"https://shopping-phinf.pstatic.net/main_5118143/51181438556.20241211202407.jpg\",\"lprice\":\"16900\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"51181438556\",\"productType\":\"1\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"식기/급수기\",\"category4\":\"식기/식탁\"},{\"title\":\"가또나인 고양이스크래쳐 옐로 레오파드 3PC 스크래쳐 2개\",\"link\":\"https://smartstore.naver.com/main/products/2058243766\",\"image\":\"https://shopping-phinf.pstatic.net/main_1185459/11854591070.14.jpg\",\"lprice\":\"17900\",\"hprice\":\"\",\"mallName\":\"GATO\",\"productId\":\"11854591070\",\"productType\":\"2\",\"brand\":\"가또나인\",\"maker\":\"빅트리\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"캣타워/스크래쳐\",\"category4\":\"스크래쳐\"},{\"title\":\"DUIT 올데이보드 고양이 스크래쳐 장난감\",\"link\":\"https://search.shopping.naver.com/catalog/33691361489\",\"image\":\"https://shopping-phinf.pstatic.net/main_3369136/33691361489.20241015154005.jpg\",\"lprice\":\"28000\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"33691361489\",\"productType\":\"1\",\"brand\":\"DUIT\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"캣타워/스크래쳐\",\"category4\":\"스크래쳐\"},{\"title\":\"루시몰 고양이 스크래쳐 원형 대형 특대형 기본 46cm\",\"link\":\"https://smartstore.naver.com/main/products/6659642344\",\"image\":\"https://shopping-phinf.pstatic.net/main_8420414/84204142666.13.jpg\",\"lprice\":\"19000\",\"hprice\":\"\",\"mallName\":\"Lusi mall\",\"productId\":\"84204142666\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"캣타워/스크래쳐\",\"category4\":\"스크래쳐\"},{\"title\":\"강아지 이불 블랭킷 고양이 담요 펫 애견 쿠션 더블유곰 소\",\"link\":\"https://smartstore.naver.com/main/products/8671921224\",\"image\":\"https://shopping-phinf.pstatic.net/main_8621642/86216421547.jpg\",\"lprice\":\"10900\",\"hprice\":\"\",\"mallName\":\"해피앤퍼피\",\"productId\":\"86216421547\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"해피앤퍼피\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"쿠션/방석\"},{\"title\":\"씨리얼펫 젤리냥수기 고양이 세라믹 정수기 반려동물 필터 음수기 1.2L\",\"link\":\"https://search.shopping.naver.com/catalog/30431203499\",\"image\":\"https://shopping-phinf.pstatic.net/main_3043120/30431203499.20250222214801.jpg\",\"lprice\":\"49900\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"30431203499\",\"productType\":\"1\",\"brand\":\"씨리얼펫\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"식기/급수기\",\"category4\":\"정수기/필터\"},{\"title\":\"수의사가 만든 라퓨클레르 강아지 고양이 샴푸 저자극 보습 목욕 300ml\",\"link\":\"https://smartstore.naver.com/main/products/10582992973\",\"image\":\"https://shopping-phinf.pstatic.net/main_8812749/88127498563.9.jpg\",\"lprice\":\"19900\",\"hprice\":\"\",\"mallName\":\"라퓨클레르\",\"productId\":\"88127498563\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"미용/목욕\",\"category4\":\"샴푸/린스/비누\"},{\"title\":\"22kg까지 견디는 고양이 해먹 윈도우 해먹 창문해먹\",\"link\":\"https://smartstore.naver.com/main/products/4709037976\",\"image\":\"https://shopping-phinf.pstatic.net/main_8225355/82253558998.2.jpg\",\"lprice\":\"6900\",\"hprice\":\"\",\"mallName\":\"홈앤스위트\",\"productId\":\"82253558998\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"침대/해먹\"},{\"title\":\"바비온 9in1 올마스터 진공 흡입 미용기 강아지 고양이 이발기 바리깡 클리퍼 셀프미용\",\"link\":\"https://smartstore.naver.com/main/products/10352906076\",\"image\":\"https://shopping-phinf.pstatic.net/main_8789741/87897410549.18.jpg\",\"lprice\":\"179000\",\"hprice\":\"\",\"mallName\":\"바비온코리아\",\"productId\":\"87897410549\",\"productType\":\"2\",\"brand\":\"바비온\",\"maker\":\"바비온\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"미용/목욕\",\"category4\":\"이발기\"},{\"title\":\"MOOQS 묵스 우드 스노우 펫 하우스 강아지집 숨숨집 고양이집\",\"link\":\"https://search.shopping.naver.com/catalog/40031843151\",\"image\":\"https://shopping-phinf.pstatic.net/main_4003184/40031843151.20250316173117.jpg\",\"lprice\":\"125000\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"40031843151\",\"productType\":\"1\",\"brand\":\"MOOQS\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"하우스\"},{\"title\":\"강아지 샴푸 올인원 린스 100% 천연 약용 각질 비듬 아토피 피부병 고양이겸용 270ml\",\"link\":\"https://smartstore.naver.com/main/products/4737618345\",\"image\":\"https://shopping-phinf.pstatic.net/main_8228213/82282139809.9.jpg\",\"lprice\":\"36000\",\"hprice\":\"\",\"mallName\":\"지켜줄개 댕댕아\",\"productId\":\"82282139809\",\"productType\":\"2\",\"brand\":\"지켜줄개댕댕아\",\"maker\":\"지켜줄개댕댕아\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"미용/목욕\",\"category4\":\"샴푸/린스/비누\"},{\"title\":\"강아지 고양이 넥카라 깔대기 목보호대 애견 중성화 쿠션 중형견 피너츠 엘리자베스 그레이M\",\"link\":\"https://smartstore.naver.com/main/products/3973660933\",\"image\":\"https://shopping-phinf.pstatic.net/main_8151818/81518181158.16.jpg\",\"lprice\":\"9800\",\"hprice\":\"\",\"mallName\":\"르쁘띠숑\",\"productId\":\"81518181158\",\"productType\":\"2\",\"brand\":\"패리스독\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"넥카라/보호대\"},{\"title\":\"코드 헬씨에이징 항산화 영양 보조제 2g x 30포, 1개\",\"link\":\"https://search.shopping.naver.com/catalog/51929018110\",\"image\":\"https://shopping-phinf.pstatic.net/main_5192901/51929018110.20241213202545.jpg\",\"lprice\":\"35900\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"51929018110\",\"productType\":\"1\",\"brand\":\"\",\"maker\":\"코스맥스펫\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"강아지 건강/관리용품\",\"category4\":\"영양제\"},{\"title\":\"세이펫 접이식 안전문 1.5m 고양이 접이식 방묘문\",\"link\":\"https://smartstore.naver.com/main/products/4937924597\",\"image\":\"https://shopping-phinf.pstatic.net/main_8248244/82482448908.10.jpg\",\"lprice\":\"142000\",\"hprice\":\"\",\"mallName\":\"세이펫\",\"productId\":\"82482448908\",\"productType\":\"2\",\"brand\":\"세이펫\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"안전문\"},{\"title\":\"고양이 난간 안전망 복층 베란다 방묘창 방묘문 방충망 캣도어 일반형검정1mx1m\",\"link\":\"https://smartstore.naver.com/main/products/6187449408\",\"image\":\"https://shopping-phinf.pstatic.net/main_8373194/83731948985.5.jpg\",\"lprice\":\"5000\",\"hprice\":\"\",\"mallName\":\"나이스메쉬\",\"productId\":\"83731948985\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"안전문\"},{\"title\":\"티지오매트 우다다 강아지매트 애견 롤 미끄럼방지 거실 복도 펫 110x50cm (10T)\",\"link\":\"https://smartstore.naver.com/main/products/5154283552\",\"image\":\"https://shopping-phinf.pstatic.net/main_8269880/82698804475.15.jpg\",\"lprice\":\"10900\",\"hprice\":\"\",\"mallName\":\"티지오매트\",\"productId\":\"82698804475\",\"productType\":\"2\",\"brand\":\"티지오매트\",\"maker\":\"티지오\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"매트\"},{\"title\":\"[페스룸] 논슬립 폴더블 욕조 강아지 고양이 목욕 접이식 스파욕조 애견욕조\",\"link\":\"https://smartstore.naver.com/main/products/5534035049\",\"image\":\"https://shopping-phinf.pstatic.net/main_8307853/83078530731.2.jpg\",\"lprice\":\"51900\",\"hprice\":\"\",\"mallName\":\"PETHROOM\",\"productId\":\"83078530731\",\"productType\":\"2\",\"brand\":\"페스룸\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"미용/목욕\",\"category4\":\"샤워기/욕조\"},{\"title\":\"제스퍼우드 원목 강아지 침대 S 애견 고양이 집 하우스 반려견 반려묘 반려동물 쿠션\",\"link\":\"https://smartstore.naver.com/main/products/4504272686\",\"image\":\"https://shopping-phinf.pstatic.net/main_8204879/82048795634.4.jpg\",\"lprice\":\"55000\",\"hprice\":\"\",\"mallName\":\"제스퍼우드공방\",\"productId\":\"82048795634\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"침대/해먹\"},{\"title\":\"펫코본 강아지집 원목 고양이 숨숨집 애견방석 강아지하우스 아이보리, M\",\"link\":\"https://search.shopping.naver.com/catalog/54190213755\",\"image\":\"https://shopping-phinf.pstatic.net/main_5419021/54190213755.20250414164048.jpg\",\"lprice\":\"49000\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"54190213755\",\"productType\":\"1\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"하우스\"},{\"title\":\"[베토퀴놀][냉장배송] 강아지 고양이 아조딜 90캡슐 - 신장질환 보조제\",\"link\":\"https://smartstore.naver.com/main/products/5572133410\",\"image\":\"https://shopping-phinf.pstatic.net/main_8311662/83116629447.11.jpg\",\"lprice\":\"75000\",\"hprice\":\"\",\"mallName\":\"블리펫89\",\"productId\":\"83116629447\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"베토퀴놀\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"강아지 건강/관리용품\",\"category4\":\"영양제\"},{\"title\":\"오구구 강아지 고양이 정수기 분수대\",\"link\":\"https://search.shopping.naver.com/catalog/29974021619\",\"image\":\"https://shopping-phinf.pstatic.net/main_2997402/29974021619.20211206154812.jpg\",\"lprice\":\"29800\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"29974021619\",\"productType\":\"1\",\"brand\":\"오구구\",\"maker\":\"HOLYTACHI\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"식기/급수기\",\"category4\":\"정수기/필터\"},{\"title\":\"강아지 방석 쿠션 애견 마약 반려견 꿀잠 개 본능 무중력 중형견 애완견 방석 S\",\"link\":\"https://smartstore.naver.com/main/products/5783071611\",\"image\":\"https://shopping-phinf.pstatic.net/main_8332757/83327571025.6.jpg\",\"lprice\":\"29900\",\"hprice\":\"\",\"mallName\":\"알록달록댕댕샵\",\"productId\":\"83327571025\",\"productType\":\"2\",\"brand\":\"쉼쉼\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"쿠션/방석\"},{\"title\":\"레토 고양이 숨숨집 2단 방석 쿠션 하우스 스크래쳐\",\"link\":\"https://search.shopping.naver.com/catalog/45872181967\",\"image\":\"https://shopping-phinf.pstatic.net/main_4587218/45872181967.20250523124214.jpg\",\"lprice\":\"18170\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"45872181967\",\"productType\":\"1\",\"brand\":\"레토\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"하우스\"},{\"title\":\"바라바 강아지 안전문 견문 애견 고양이 방묘문 베란다 펫도어\",\"link\":\"https://search.shopping.naver.com/catalog/35924635714\",\"image\":\"https://shopping-phinf.pstatic.net/main_3592463/35924635714.20231129051432.jpg\",\"lprice\":\"29800\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"35924635714\",\"productType\":\"1\",\"brand\":\"바라바\",\"maker\":\"바라바\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"안전문\"},{\"title\":\"라우라반 강아지밥그릇 물그릇 고양이 식탁 도자기 높이 조절 식기 그릇 수반\",\"link\":\"https://smartstore.naver.com/main/products/10130414591\",\"image\":\"https://shopping-phinf.pstatic.net/main_8767491/87674917667.1.jpg\",\"lprice\":\"19500\",\"hprice\":\"\",\"mallName\":\"라우라반\",\"productId\":\"87674917667\",\"productType\":\"2\",\"brand\":\"라우라반\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"식기/급수기\",\"category4\":\"식기/식탁\"},{\"title\":\"강아지 고양이 빗 스팀 브러쉬 털청소기 스팀빗\",\"link\":\"https://smartstore.naver.com/main/products/10069170353\",\"image\":\"https://shopping-phinf.pstatic.net/main_8761367/87613672977.17.jpg\",\"lprice\":\"11900\",\"hprice\":\"\",\"mallName\":\"캣트럴파크\",\"productId\":\"87613672977\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"미용/목욕\",\"category4\":\"브러시/빗\"},{\"title\":\"비니비니펫 아지트 스크래처 고양이 스크래쳐 대형 숨숨집 하우스 스크래쳐\",\"link\":\"https://smartstore.naver.com/main/products/10280963095\",\"image\":\"https://shopping-phinf.pstatic.net/main_8782546/87825466919.13.jpg\",\"lprice\":\"37900\",\"hprice\":\"\",\"mallName\":\"비니비니펫\",\"productId\":\"87825466919\",\"productType\":\"2\",\"brand\":\"비니비니펫\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"캣타워/스크래쳐\",\"category4\":\"스크래쳐\"},{\"title\":\"퓨어프렌즈 퓨어 밸런스 천연 강아지 샴푸 300ml, 1개\",\"link\":\"https://search.shopping.naver.com/catalog/52203429639\",\"image\":\"https://shopping-phinf.pstatic.net/main_5220342/52203429639.20250331163115.jpg\",\"lprice\":\"23500\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"52203429639\",\"productType\":\"1\",\"brand\":\"퓨어프렌즈\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"미용/목욕\",\"category4\":\"샴푸/린스/비누\"},{\"title\":\"고양이 밥그릇 도자기 세라믹 급체방지 슬로우 식기 그릇 높이 식탁\",\"link\":\"https://smartstore.naver.com/main/products/6131993369\",\"image\":\"https://shopping-phinf.pstatic.net/main_8367649/83676492857.2.jpg\",\"lprice\":\"9400\",\"hprice\":\"\",\"mallName\":\"마브펫\",\"productId\":\"83676492857\",\"productType\":\"2\",\"brand\":\"마브펫\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"식기/급수기\",\"category4\":\"식기/식탁\"},{\"title\":\"강아지 고양이 아이스팩 파우치 여름 베개 젤리곰 M사이즈\",\"link\":\"https://smartstore.naver.com/main/products/8554743594\",\"image\":\"https://shopping-phinf.pstatic.net/main_8609924/86099243917.3.jpg\",\"lprice\":\"9900\",\"hprice\":\"\",\"mallName\":\"예쁘개살고양\",\"productId\":\"86099243917\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"쿠션/방석\"},{\"title\":\"강아지 고양이 애견 대형견 하우스 텐트 야외개집 숨숨집 S\",\"link\":\"https://smartstore.naver.com/main/products/7626829741\",\"image\":\"https://shopping-phinf.pstatic.net/main_8517133/85171330063.1.jpg\",\"lprice\":\"24000\",\"hprice\":\"\",\"mallName\":\"미우프\",\"productId\":\"85171330063\",\"productType\":\"2\",\"brand\":\"UNKNOWN\",\"maker\":\"UNKNOWN\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"하우스\"},{\"title\":\"이너피스 원목 강아지집 애견하우스 고양이숨숨집 A\",\"link\":\"https://smartstore.naver.com/main/products/3307441934\",\"image\":\"https://shopping-phinf.pstatic.net/main_8080606/80806066376.14.jpg\",\"lprice\":\"79000\",\"hprice\":\"\",\"mallName\":\"innerpeace이너피스\",\"productId\":\"80806066376\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"하우스\"},{\"title\":\"펫토 알러프리 강아지방석 고양이 애견 쿠션 쿨방석 범퍼형 라이트그레이, M\",\"link\":\"https://search.shopping.naver.com/catalog/54236867637\",\"image\":\"https://shopping-phinf.pstatic.net/main_5423686/54236867637.20250416115734.jpg\",\"lprice\":\"49800\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"54236867637\",\"productType\":\"1\",\"brand\":\"펫토\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"쿠션/방석\"},{\"title\":\"원시림의곰 금빗\",\"link\":\"https://search.shopping.naver.com/catalog/54233894193\",\"image\":\"https://shopping-phinf.pstatic.net/main_5423389/54233894193.20250416084020.jpg\",\"lprice\":\"65700\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"54233894193\",\"productType\":\"1\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"미용/목욕\",\"category4\":\"브러시/빗\"},{\"title\":\"원목 캣타워 캣워커 캣폴 고양이에버랜드 2 (고양이와나무꾼)\",\"link\":\"https://smartstore.naver.com/main/products/4701485622\",\"image\":\"https://shopping-phinf.pstatic.net/main_8224600/82246006480.11.jpg\",\"lprice\":\"312000\",\"hprice\":\"\",\"mallName\":\"고양이와나무꾼\",\"productId\":\"82246006480\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"캣타워/스크래쳐\",\"category4\":\"캣타워/캣폴\"},{\"title\":\"펫펫펫 고양이 스크래쳐 수직 대형\",\"link\":\"https://smartstore.naver.com/main/products/5491461598\",\"image\":\"https://shopping-phinf.pstatic.net/main_8303595/83035956658.4.jpg\",\"lprice\":\"26700\",\"hprice\":\"\",\"mallName\":\"펫펫펫 PPPET\",\"productId\":\"83035956658\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"캣타워/스크래쳐\",\"category4\":\"스크래쳐\"},{\"title\":\"슈퍼펫 강아지밥그릇 고양이 식기 물그릇 3단 높이조절 커브 도자기 식탁세트\",\"link\":\"https://search.shopping.naver.com/catalog/55401583212\",\"image\":\"https://shopping-phinf.pstatic.net/main_5540158/55401583212.20250621045841.jpg\",\"lprice\":\"22900\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"55401583212\",\"productType\":\"1\",\"brand\":\"슈퍼펫\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"식기/급수기\",\"category4\":\"식기/식탁\"},{\"title\":\"펫테일 올독방석 강아지 방석 대형견 쿠션 극세사 면 M\",\"link\":\"https://smartstore.naver.com/main/products/4827270040\",\"image\":\"https://shopping-phinf.pstatic.net/main_8237179/82371792892.3.jpg\",\"lprice\":\"24900\",\"hprice\":\"\",\"mallName\":\"펫테일코리아\",\"productId\":\"82371792892\",\"productType\":\"2\",\"brand\":\"펫테일\",\"maker\":\"주떼인터내셔날\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"쿠션/방석\"},{\"title\":\"펫조은자리 듀라론 100% 강아지 쿨매트 3D에어매쉬 냉감패드 애견 고양이 여름방석\",\"link\":\"https://smartstore.naver.com/main/products/11697645474\",\"image\":\"https://shopping-phinf.pstatic.net/main_8924215/89242155941.1.jpg\",\"lprice\":\"39800\",\"hprice\":\"\",\"mallName\":\"영메디칼바이오\",\"productId\":\"89242155941\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"영메디칼바이오\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"매트\"},{\"title\":\"까치토 더보틀 휴대용 강아지 고양이 물통 애견 산책물병 원터치 급수기\",\"link\":\"https://smartstore.naver.com/main/products/9561639195\",\"image\":\"https://shopping-phinf.pstatic.net/main_8710614/87106141465.7.jpg\",\"lprice\":\"9800\",\"hprice\":\"\",\"mallName\":\"까치토\",\"productId\":\"87106141465\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"식기/급수기\",\"category4\":\"급수기/물병\"},{\"title\":\"펫모어 오메가침대 여름 방수 쿨매트 슬개골 강아지침대 펫 베드 애견 방석 고양이쇼파 소파 [국내생산]\",\"link\":\"https://smartstore.naver.com/main/products/6096500544\",\"image\":\"https://shopping-phinf.pstatic.net/main_8364100/83641000032.2.jpg\",\"lprice\":\"59000\",\"hprice\":\"\",\"mallName\":\"미르공간\",\"productId\":\"83641000032\",\"productType\":\"2\",\"brand\":\"펫모어\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"침대/해먹\"},{\"title\":\"이츠독 강아지 고양이 쿨매트 인견 방석 여름 애견 쿨링 패드\",\"link\":\"https://smartstore.naver.com/main/products/2964096923\",\"image\":\"https://shopping-phinf.pstatic.net/main_8046184/80461840901.1.jpg\",\"lprice\":\"32000\",\"hprice\":\"\",\"mallName\":\"이츠독\",\"productId\":\"80461840901\",\"productType\":\"2\",\"brand\":\"이츠독\",\"maker\":\"이츠독\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"매트\"},{\"title\":\"펫쭈 고양이 AI 자동급식기 강아지 360도 회전 카메라 반려동물 펫\",\"link\":\"https://smartstore.naver.com/main/products/10420577952\",\"image\":\"https://shopping-phinf.pstatic.net/main_8796508/87965082938.17.jpg\",\"lprice\":\"273900\",\"hprice\":\"\",\"mallName\":\"펫쭈\",\"productId\":\"87965082938\",\"productType\":\"2\",\"brand\":\"펫쭈\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"식기/급수기\",\"category4\":\"자동급식기\"},{\"title\":\"올웨이즈올펫 코닉 숨숨집 고양이 강아지 하우스 그레이, M\",\"link\":\"https://search.shopping.naver.com/catalog/53665784947\",\"image\":\"https://shopping-phinf.pstatic.net/main_5366578/53665784947.20250320141714.jpg\",\"lprice\":\"25400\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53665784947\",\"productType\":\"1\",\"brand\":\"올웨이즈올펫\",\"maker\":\"지오위즈\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"하우스\"},{\"title\":\"펫초이스 댕피스텔 강아지 텐트 고양이 쿠션 숨숨 집 하우스 크림 크림, S\",\"link\":\"https://search.shopping.naver.com/catalog/54190191811\",\"image\":\"https://shopping-phinf.pstatic.net/main_5419019/54190191811.20250429171332.jpg\",\"lprice\":\"38900\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"54190191811\",\"productType\":\"1\",\"brand\":\"펫초이스\",\"maker\":\"프랑코모다\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"하우스\"},{\"title\":\"고양이 스크래쳐 숨숨집 하우스 대형 원목 스크레쳐 A type\",\"link\":\"https://smartstore.naver.com/main/products/8137026692\",\"image\":\"https://shopping-phinf.pstatic.net/main_8568152/85681527015.2.jpg\",\"lprice\":\"14900\",\"hprice\":\"\",\"mallName\":\"미우프\",\"productId\":\"85681527015\",\"productType\":\"2\",\"brand\":\"UNKNOWN\",\"maker\":\"UNKNOWN\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"캣타워/스크래쳐\",\"category4\":\"스크래쳐\"},{\"title\":\"제로넥카라 강아지 고양이 초경량 가벼운 편안한 중성화 미용 깔대기 실내용 넥카라\",\"link\":\"https://smartstore.naver.com/main/products/7499603619\",\"image\":\"https://shopping-phinf.pstatic.net/main_8504410/85044103941.jpg\",\"lprice\":\"24000\",\"hprice\":\"\",\"mallName\":\"루니펫\",\"productId\":\"85044103941\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"넥카라/보호대\"},{\"title\":\"펫토 클린펫 강아지 계단 고양이 논슬립 스텝 라이트그레이, 2단\",\"link\":\"https://search.shopping.naver.com/catalog/54892869310\",\"image\":\"https://shopping-phinf.pstatic.net/main_5489286/54892869310.20250521143121.jpg\",\"lprice\":\"49800\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"54892869310\",\"productType\":\"1\",\"brand\":\"펫토\",\"maker\":\"펫토\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"계단/스텝\"},{\"title\":\"[폴딩70x60cm] 디팡 4mm 미끄럼방지 강아지 고양이매트 애견매트 슬개골탈구예방\",\"link\":\"https://smartstore.naver.com/main/products/2122490803\",\"image\":\"https://shopping-phinf.pstatic.net/main_1206556/12065560134.58.jpg\",\"lprice\":\"14800\",\"hprice\":\"\",\"mallName\":\"디팡\",\"productId\":\"12065560134\",\"productType\":\"2\",\"brand\":\"디팡\",\"maker\":\"디팡\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"매트\"},{\"title\":\"슈퍼벳 안티콜록 강아지 기관지 영양제 협착증 호흡기 기침 약x 60캡슐\",\"link\":\"https://smartstore.naver.com/main/products/8470675034\",\"image\":\"https://shopping-phinf.pstatic.net/main_8601517/86015175357.5.jpg\",\"lprice\":\"25020\",\"hprice\":\"\",\"mallName\":\"슈퍼벳\",\"productId\":\"86015175357\",\"productType\":\"2\",\"brand\":\"슈퍼벳\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"강아지 건강/관리용품\",\"category4\":\"영양제\"},{\"title\":\"HAKKI 강아지 해먹 대형견쿨매트 애견침대 블랙색상 S\",\"link\":\"https://smartstore.naver.com/main/products/3477192248\",\"image\":\"https://shopping-phinf.pstatic.net/main_8102170/81021709385.jpg\",\"lprice\":\"18800\",\"hprice\":\"\",\"mallName\":\"돈키호테쇼핑몰\",\"productId\":\"81021709385\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"돈키호테\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"침대/해먹\"},{\"title\":\"링펫 강아지 고양이 물그릇 밥그릇 식기 아크릴 유리수반 중형\",\"link\":\"https://search.shopping.naver.com/catalog/33629233457\",\"image\":\"https://shopping-phinf.pstatic.net/main_3362923/33629233457.20250512014917.jpg\",\"lprice\":\"18900\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"33629233457\",\"productType\":\"1\",\"brand\":\"링펫\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"식기/급수기\",\"category4\":\"식기/식탁\"},{\"title\":\"페노비스 고양이 강아지 치약 바르는 입냄새 플라그 구취 치석 제거 임상균주 오랄벳\",\"link\":\"https://smartstore.naver.com/main/products/10800961164\",\"image\":\"https://shopping-phinf.pstatic.net/main_8834546/88345467154.4.jpg\",\"lprice\":\"15900\",\"hprice\":\"\",\"mallName\":\"페노비스\",\"productId\":\"88345467154\",\"productType\":\"2\",\"brand\":\"페노비스\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"강아지 건강/관리용품\",\"category4\":\"치약\"},{\"title\":\"네네린도 수직 월 고양이 스크래쳐 웜 화이트, L(대형)\",\"link\":\"https://search.shopping.naver.com/catalog/54114571823\",\"image\":\"https://shopping-phinf.pstatic.net/main_5411457/54114571823.20250411160223.jpg\",\"lprice\":\"21400\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"54114571823\",\"productType\":\"1\",\"brand\":\"네네린도\",\"maker\":\"네네린도\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"캣타워/스크래쳐\",\"category4\":\"스크래쳐\"},{\"title\":\"리포소펫 강아지매트 미끄럼방지 애견 반려견 거실 복도 셀프시공 롤매트 6T 110X50cm\",\"link\":\"https://smartstore.naver.com/main/products/5151541190\",\"image\":\"https://shopping-phinf.pstatic.net/main_8269606/82696062046.45.jpg\",\"lprice\":\"11400\",\"hprice\":\"\",\"mallName\":\"리포소펫\",\"productId\":\"82696062046\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"매트\"},{\"title\":\"페노비스 고양이 강아지 관절영양제 슬개골 연골 관절염 노견영양제 캡슐 벳 글루코사민\",\"link\":\"https://smartstore.naver.com/main/products/11149454290\",\"image\":\"https://shopping-phinf.pstatic.net/main_8869396/88693964612.5.jpg\",\"lprice\":\"22900\",\"hprice\":\"\",\"mallName\":\"페노비스\",\"productId\":\"88693964612\",\"productType\":\"2\",\"brand\":\"페노비스\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"강아지 건강/관리용품\",\"category4\":\"영양제\"},{\"title\":\"펫코본 강아지계단 고양이 논슬립 애견 펫스텝 침대 슬라이드 A형\",\"link\":\"https://search.shopping.naver.com/catalog/55343999616\",\"image\":\"https://shopping-phinf.pstatic.net/main_5534399/55343999616.20250618102528.jpg\",\"lprice\":\"59000\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"55343999616\",\"productType\":\"1\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"계단/스텝\"},{\"title\":\"보울보울 고양이 밥그릇 강아지 식기 헬로볼 세트\",\"link\":\"https://smartstore.naver.com/main/products/5108893506\",\"image\":\"https://shopping-phinf.pstatic.net/main_8265341/82653415552.10.jpg\",\"lprice\":\"31900\",\"hprice\":\"\",\"mallName\":\"보울보울\",\"productId\":\"82653415552\",\"productType\":\"2\",\"brand\":\"보울보울\",\"maker\":\"보울보울\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"식기/급수기\",\"category4\":\"식기/식탁\"},{\"title\":\"강아지방석 고양이 쿠션 매트 유모차 개모차 개 꿀잠 이불 원터치 떠블유곰 소\",\"link\":\"https://smartstore.naver.com/main/products/8571815502\",\"image\":\"https://shopping-phinf.pstatic.net/main_8611631/86116315825.jpg\",\"lprice\":\"32000\",\"hprice\":\"\",\"mallName\":\"해피앤퍼피\",\"productId\":\"86116315825\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"해피앤퍼피\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"쿠션/방석\"},{\"title\":\"큐브플래닛 윈도우 고양이 선반 해먹 캣워커 캣선반 소형 (창문, 창틀에 설치하세요)\",\"link\":\"https://smartstore.naver.com/main/products/5660301120\",\"image\":\"https://shopping-phinf.pstatic.net/main_8320479/83204798455.9.jpg\",\"lprice\":\"19800\",\"hprice\":\"\",\"mallName\":\"큐브 플래닛\",\"productId\":\"83204798455\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"캣타워/스크래쳐\",\"category4\":\"캣타워/캣폴\"},{\"title\":\"아껴주다 저자극 천연 고양이 샴푸 500ml (고양이 비듬, 턱드름 관리)\",\"link\":\"https://smartstore.naver.com/main/products/5054264001\",\"image\":\"https://shopping-phinf.pstatic.net/main_8259878/82598785222.12.jpg\",\"lprice\":\"18500\",\"hprice\":\"\",\"mallName\":\"아껴주다\",\"productId\":\"82598785222\",\"productType\":\"2\",\"brand\":\"아껴주다\",\"maker\":\"아껴주다\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"미용/목욕\",\"category4\":\"샴푸/린스/비누\"},{\"title\":\"하개랩 상쾌하개 강아지 고양이 기관지 영양제 협착증 기침 켁켁거림\",\"link\":\"https://smartstore.naver.com/main/products/10078212989\",\"image\":\"https://shopping-phinf.pstatic.net/main_8762271/87622715642.2.jpg\",\"lprice\":\"25000\",\"hprice\":\"\",\"mallName\":\"하개 LAB\",\"productId\":\"87622715642\",\"productType\":\"2\",\"brand\":\"하개LAB\",\"maker\":\"칠명바이오\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"강아지 건강/관리용품\",\"category4\":\"영양제\"},{\"title\":\"강아지 방석 대형견 애견 쿠션 포근한 반려견 침대 그레이 L\",\"link\":\"https://smartstore.naver.com/main/products/5652281382\",\"image\":\"https://shopping-phinf.pstatic.net/main_8319677/83196778686.41.jpg\",\"lprice\":\"19800\",\"hprice\":\"\",\"mallName\":\"펫브랜디\",\"productId\":\"83196778686\",\"productType\":\"2\",\"brand\":\"펫브랜디\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"쿠션/방석\"},{\"title\":\"네코이찌 고양이 발톱깍이\",\"link\":\"https://search.shopping.naver.com/catalog/53669243993\",\"image\":\"https://shopping-phinf.pstatic.net/main_5366924/53669243993.20250320194701.jpg\",\"lprice\":\"15900\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53669243993\",\"productType\":\"1\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"미용/목욕\",\"category4\":\"발톱/발 관리\"},{\"title\":\"펠리웨이 클래식 스타터키트 고양이 페로몬 디퓨저 이사 동물병원외출 스트레스완화 진정\",\"link\":\"https://smartstore.naver.com/main/products/11486023143\",\"image\":\"https://shopping-phinf.pstatic.net/main_8903053/89030533508.jpg\",\"lprice\":\"34000\",\"hprice\":\"\",\"mallName\":\"MOKOA\",\"productId\":\"89030533508\",\"productType\":\"2\",\"brand\":\"펠리웨이\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"미용/목욕\",\"category4\":\"에센스/향수/밤\"},{\"title\":\"위티 강아지 빗 콤빗 고양이 슬리커 브러쉬\",\"link\":\"https://smartstore.naver.com/main/products/9970804750\",\"image\":\"https://shopping-phinf.pstatic.net/main_8751530/87515307023.2.jpg\",\"lprice\":\"8900\",\"hprice\":\"\",\"mallName\":\"위티witty\",\"productId\":\"87515307023\",\"productType\":\"2\",\"brand\":\"ouitt\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"미용/목욕\",\"category4\":\"브러시/빗\"},{\"title\":\"보니렌 퓨어냥 고양이 정수기 강아지정수기 고양이 음수대 자동급수기\",\"link\":\"https://smartstore.naver.com/main/products/11364128365\",\"image\":\"https://shopping-phinf.pstatic.net/main_8890863/88908638730.5.jpg\",\"lprice\":\"59900\",\"hprice\":\"\",\"mallName\":\"보니렌\",\"productId\":\"88908638730\",\"productType\":\"2\",\"brand\":\"보니렌\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"식기/급수기\",\"category4\":\"정수기/필터\"},{\"title\":\"탑컷 애견이발기 YD9000 프로 클리퍼 강아지 고양이 미용 바리깡\",\"link\":\"https://smartstore.naver.com/main/products/5238078134\",\"image\":\"https://shopping-phinf.pstatic.net/main_8278260/82782600545.6.jpg\",\"lprice\":\"90000\",\"hprice\":\"\",\"mallName\":\"탑컷\",\"productId\":\"82782600545\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"미용/목욕\",\"category4\":\"이발기\"},{\"title\":\"세임스텝 [무선] 애견 미용기 클리퍼 강아지 고양이 바리깡 셀프 펫 진공 흡입 털 청소기\",\"link\":\"https://smartstore.naver.com/main/products/11205843632\",\"image\":\"https://shopping-phinf.pstatic.net/main_8875035/88750353963.2.jpg\",\"lprice\":\"109900\",\"hprice\":\"\",\"mallName\":\"뉴트로 스토어\",\"productId\":\"88750353963\",\"productType\":\"2\",\"brand\":\"세임스텝\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"미용/목욕\",\"category4\":\"이발기\"},{\"title\":\"독톡 강아지 커스텀 울타리 1P\",\"link\":\"https://smartstore.naver.com/main/products/2426030847\",\"image\":\"https://shopping-phinf.pstatic.net/main_1325105/13251055464.14.jpg\",\"lprice\":\"22500\",\"hprice\":\"\",\"mallName\":\"독톡\",\"productId\":\"13251055464\",\"productType\":\"2\",\"brand\":\"독톡\",\"maker\":\"독톡\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"울타리\"},{\"title\":\"캣튜디오 고양이 유리 물그릇 강아지 밥그릇 식기 수반 유리화이트식기S\",\"link\":\"https://smartstore.naver.com/main/products/6512908155\",\"image\":\"https://shopping-phinf.pstatic.net/main_8405740/84057408488.7.jpg\",\"lprice\":\"7400\",\"hprice\":\"\",\"mallName\":\"캣튜디오\",\"productId\":\"84057408488\",\"productType\":\"2\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"식기/급수기\",\"category4\":\"식기/식탁\"},{\"title\":\"공간녹백 고양이 캣휠 무소음 켓휠 쳇바퀴 M 1개\",\"link\":\"https://search.shopping.naver.com/catalog/49559295153\",\"image\":\"https://shopping-phinf.pstatic.net/main_4955929/49559295153.20240802032032.jpg\",\"lprice\":\"82000\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"49559295153\",\"productType\":\"1\",\"brand\":\"\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"캣타워/스크래쳐\",\"category4\":\"캣휠\"},{\"title\":\"바라바 강아지 밥그릇 고양이 물그릇 애견 도자기 그릇 높이조절 식기 식탁 수반 세트\",\"link\":\"https://search.shopping.naver.com/catalog/50033034869\",\"image\":\"https://shopping-phinf.pstatic.net/main_5003303/50033034869.20240829050921.jpg\",\"lprice\":\"28800\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"50033034869\",\"productType\":\"1\",\"brand\":\"바라바\",\"maker\":\"바라바\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"식기/급수기\",\"category4\":\"식기/식탁\"},{\"title\":\"이드몽 강아지 넥카라 고양이 애견 깔대기 쿠션 시즌2프라가S\",\"link\":\"https://search.shopping.naver.com/catalog/36713411331\",\"image\":\"https://shopping-phinf.pstatic.net/main_3671341/36713411331.20230618043123.jpg\",\"lprice\":\"13900\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"36713411331\",\"productType\":\"1\",\"brand\":\"이드몽\",\"maker\":\"\",\"category1\":\"생활/건강\",\"category2\":\"반려동물\",\"category3\":\"리빙용품\",\"category4\":\"넥카라/보호대\"},{\"title\":\"Apple 아이패드 11세대 실버, 128GB, WiFi전용\",\"link\":\"https://search.shopping.naver.com/catalog/53370909201\",\"image\":\"https://shopping-phinf.pstatic.net/main_5337090/53370909201.20250403155536.jpg\",\"lprice\":\"520500\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53370909201\",\"productType\":\"1\",\"brand\":\"Apple\",\"maker\":\"Apple\",\"category1\":\"디지털/가전\",\"category2\":\"태블릿PC\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"Apple 아이패드 11세대 블루, 128GB, WiFi전용\",\"link\":\"https://search.shopping.naver.com/catalog/53370758552\",\"image\":\"https://shopping-phinf.pstatic.net/main_5337075/53370758552.20250403155332.jpg\",\"lprice\":\"525800\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53370758552\",\"productType\":\"1\",\"brand\":\"Apple\",\"maker\":\"Apple\",\"category1\":\"디지털/가전\",\"category2\":\"태블릿PC\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"Apple 아이패드 11세대 핑크, 128GB, WiFi전용\",\"link\":\"https://search.shopping.naver.com/catalog/53370808130\",\"image\":\"https://shopping-phinf.pstatic.net/main_5337080/53370808130.20250403155104.jpg\",\"lprice\":\"527700\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53370808130\",\"productType\":\"1\",\"brand\":\"Apple\",\"maker\":\"Apple\",\"category1\":\"디지털/가전\",\"category2\":\"태블릿PC\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"Apple 아이패드 11세대 옐로, 128GB, WiFi전용\",\"link\":\"https://search.shopping.naver.com/catalog/53370875209\",\"image\":\"https://shopping-phinf.pstatic.net/main_5337087/53370875209.20250403155436.jpg\",\"lprice\":\"525900\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53370875209\",\"productType\":\"1\",\"brand\":\"Apple\",\"maker\":\"Apple\",\"category1\":\"디지털/가전\",\"category2\":\"태블릿PC\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"Apple 아이패드 에어 11 7세대 M3 스페이스그레이, 128GB, WiFi전용\",\"link\":\"https://search.shopping.naver.com/catalog/53371237199\",\"image\":\"https://shopping-phinf.pstatic.net/main_5337123/53371237199.20250403153417.jpg\",\"lprice\":\"884810\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53371237199\",\"productType\":\"1\",\"brand\":\"Apple\",\"maker\":\"Apple\",\"category1\":\"디지털/가전\",\"category2\":\"태블릿PC\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"Apple 아이패드 11세대 실버, 256GB, WiFi전용\",\"link\":\"https://search.shopping.naver.com/catalog/53370909202\",\"image\":\"https://shopping-phinf.pstatic.net/main_5337090/53370909202.20250403155553.jpg\",\"lprice\":\"679000\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53370909202\",\"productType\":\"1\",\"brand\":\"Apple\",\"maker\":\"Apple\",\"category1\":\"디지털/가전\",\"category2\":\"태블릿PC\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"Apple 아이패드 미니 7세대 스페이스그레이, 128GB, WiFi전용\",\"link\":\"https://search.shopping.naver.com/catalog/53351852199\",\"image\":\"https://shopping-phinf.pstatic.net/main_5335185/53351852199.20250304153610.jpg\",\"lprice\":\"696570\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53351852199\",\"productType\":\"1\",\"brand\":\"Apple\",\"maker\":\"Apple\",\"category1\":\"디지털/가전\",\"category2\":\"태블릿PC\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"Apple 아이패드 에어 13 7세대 M3 스페이스그레이, 128GB, WiFi전용\",\"link\":\"https://search.shopping.naver.com/catalog/53371410788\",\"image\":\"https://shopping-phinf.pstatic.net/main_5337141/53371410788.20250403154146.jpg\",\"lprice\":\"1199040\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53371410788\",\"productType\":\"1\",\"brand\":\"Apple\",\"maker\":\"Apple\",\"category1\":\"디지털/가전\",\"category2\":\"태블릿PC\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"Apple 아이패드 프로 11 5세대 M4 스탠다드 글래스 스페이스 블랙, 256GB, WiFi전용\",\"link\":\"https://search.shopping.naver.com/catalog/53394317288\",\"image\":\"https://shopping-phinf.pstatic.net/main_5339431/53394317288.20250306171208.jpg\",\"lprice\":\"1393580\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53394317288\",\"productType\":\"1\",\"brand\":\"Apple\",\"maker\":\"Apple\",\"category1\":\"디지털/가전\",\"category2\":\"태블릿PC\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"Apple 아이패드 프로 13 7세대 M4 스탠다드 글래스 스페이스 블랙, 256GB, WiFi전용\",\"link\":\"https://search.shopping.naver.com/catalog/53491820442\",\"image\":\"https://shopping-phinf.pstatic.net/main_5349182/53491820442.20250311162829.jpg\",\"lprice\":\"1897700\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53491820442\",\"productType\":\"1\",\"brand\":\"Apple\",\"maker\":\"Apple\",\"category1\":\"디지털/가전\",\"category2\":\"태블릿PC\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"Apple 아이패드 11세대 블루, 256GB, WiFi전용\",\"link\":\"https://search.shopping.naver.com/catalog/53370758553\",\"image\":\"https://shopping-phinf.pstatic.net/main_5337075/53370758553.20250403155346.jpg\",\"lprice\":\"679000\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53370758553\",\"productType\":\"1\",\"brand\":\"Apple\",\"maker\":\"Apple\",\"category1\":\"디지털/가전\",\"category2\":\"태블릿PC\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"애플 아이패드 11세대 A16 WIFI 128GB 2025출시 관부포함 미국애플정품\",\"link\":\"https://smartstore.naver.com/main/products/11553506634\",\"image\":\"https://shopping-phinf.pstatic.net/main_8909801/89098017040.3.jpg\",\"lprice\":\"459900\",\"hprice\":\"\",\"mallName\":\"제니퍼스토리\",\"productId\":\"89098017040\",\"productType\":\"2\",\"brand\":\"아이패드\",\"maker\":\"Apple\",\"category1\":\"디지털/가전\",\"category2\":\"태블릿PC\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"Apple 아이패드 10세대 실버, 64GB, WiFi전용\",\"link\":\"https://search.shopping.naver.com/catalog/53212173186\",\"image\":\"https://shopping-phinf.pstatic.net/main_5321217/53212173186.20250225172035.jpg\",\"lprice\":\"557000\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53212173186\",\"productType\":\"1\",\"brand\":\"Apple\",\"maker\":\"Apple\",\"category1\":\"디지털/가전\",\"category2\":\"태블릿PC\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"Apple 2025 아이패드 에어 11 M3  스페이스그레이  128GB  Wi-Fi MC9W4KH/A\",\"link\":\"https://link.coupang.com/re/PCSNAVERPCSDP?pageKey=8820001925&ctag=8820001925&lptag=I25079475724&itemId=25079475724&vendorItemId=92083407421&spec=10305197\",\"image\":\"https://shopping-phinf.pstatic.net/main_5393557/53935570413.1.jpg\",\"lprice\":\"884820\",\"hprice\":\"\",\"mallName\":\"쿠팡\",\"productId\":\"53935570413\",\"productType\":\"3\",\"brand\":\"Apple\",\"maker\":\"Apple\",\"category1\":\"디지털/가전\",\"category2\":\"태블릿PC\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"미사용 애플 아이패드 미니 5세대 WIFI 64GB 스페이스그레이\",\"link\":\"https://smartstore.naver.com/main/products/6555981468\",\"image\":\"https://shopping-phinf.pstatic.net/main_8410048/84100481801.jpg\",\"lprice\":\"398000\",\"hprice\":\"\",\"mallName\":\"도란:\",\"productId\":\"84100481801\",\"productType\":\"2\",\"brand\":\"Apple\",\"maker\":\"Apple\",\"category1\":\"디지털/가전\",\"category2\":\"태블릿PC\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"Apple 아이패드 에어 11 7세대 M3 퍼플, 128GB, WiFi전용\",\"link\":\"https://search.shopping.naver.com/catalog/53371237381\",\"image\":\"https://shopping-phinf.pstatic.net/main_5337123/53371237381.20250403153732.jpg\",\"lprice\":\"897000\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53371237381\",\"productType\":\"1\",\"brand\":\"Apple\",\"maker\":\"Apple\",\"category1\":\"디지털/가전\",\"category2\":\"태블릿PC\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"Apple 아이패드 9세대 스페이스그레이, 64GB, WiFi전용\",\"link\":\"https://search.shopping.naver.com/catalog/53352561711\",\"image\":\"https://shopping-phinf.pstatic.net/main_5335256/53352561711.20250304165819.jpg\",\"lprice\":\"434490\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53352561711\",\"productType\":\"1\",\"brand\":\"Apple\",\"maker\":\"Apple\",\"category1\":\"디지털/가전\",\"category2\":\"태블릿PC\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"[미국당일출고]애플 아이패드 11세대 A16 WIFI 128GB 2025 신제품 미국 정품\",\"link\":\"https://smartstore.naver.com/main/products/11553327971\",\"image\":\"https://shopping-phinf.pstatic.net/main_8909783/89097838377.4.jpg\",\"lprice\":\"459900\",\"hprice\":\"\",\"mallName\":\"뉴욕 스토리\",\"productId\":\"89097838377\",\"productType\":\"2\",\"brand\":\"아이패드\",\"maker\":\"Apple\",\"category1\":\"디지털/가전\",\"category2\":\"태블릿PC\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"Apple 아이패드 에어 13 6세대 M2 퍼플, 128GB, WiFi전용\",\"link\":\"https://search.shopping.naver.com/catalog/53318261103\",\"image\":\"https://shopping-phinf.pstatic.net/main_5331826/53318261103.20250303172440.jpg\",\"lprice\":\"1019140\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53318261103\",\"productType\":\"1\",\"brand\":\"Apple\",\"maker\":\"Apple\",\"category1\":\"디지털/가전\",\"category2\":\"태블릿PC\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"Apple 아이패드 프로 11 5세대 M4 스탠다드 글래스 실버, 256GB, WiFi전용\",\"link\":\"https://search.shopping.naver.com/catalog/53394328115\",\"image\":\"https://shopping-phinf.pstatic.net/main_5339432/53394328115.20250306172608.jpg\",\"lprice\":\"1392840\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53394328115\",\"productType\":\"1\",\"brand\":\"Apple\",\"maker\":\"Apple\",\"category1\":\"디지털/가전\",\"category2\":\"태블릿PC\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"삼성 노트북 i7 윈도우11프로 사무용 인강용 업무용 교육용 학생 노트북 NT551XDA [소상공인/기업체 우대]\",\"link\":\"https://smartstore.naver.com/main/products/10532359076\",\"image\":\"https://shopping-phinf.pstatic.net/main_8807686/88076864436.4.jpg\",\"lprice\":\"2598990\",\"hprice\":\"\",\"mallName\":\"삼성온라인몰\",\"productId\":\"88076864436\",\"productType\":\"2\",\"brand\":\"삼성\",\"maker\":\"삼성전자\",\"category1\":\"디지털/가전\",\"category2\":\"노트북\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"ASUS ROG Flow Z13 GZ302EA-RU110W 64GB, 1TB\",\"link\":\"https://search.shopping.naver.com/catalog/53902497170\",\"image\":\"https://shopping-phinf.pstatic.net/main_5390249/53902497170.20250401141458.jpg\",\"lprice\":\"3749000\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53902497170\",\"productType\":\"1\",\"brand\":\"ASUS\",\"maker\":\"ASUS\",\"category1\":\"디지털/가전\",\"category2\":\"노트북\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"ASUS 노트북 비보북15 라이젠7 8GB 512GB 대학생 인강용 사무용 저렴한 포토샵\",\"link\":\"https://smartstore.naver.com/main/products/11577222869\",\"image\":\"https://shopping-phinf.pstatic.net/main_8912173/89121733275.4.jpg\",\"lprice\":\"519000\",\"hprice\":\"\",\"mallName\":\"창이로운\",\"productId\":\"89121733275\",\"productType\":\"2\",\"brand\":\"ASUS\",\"maker\":\"ASUS\",\"category1\":\"디지털/가전\",\"category2\":\"노트북\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"삼성전자 갤럭시북5 프로 NT960XHA-KP72G 32GB, 512GB\",\"link\":\"https://search.shopping.naver.com/catalog/54024331464\",\"image\":\"https://shopping-phinf.pstatic.net/main_5402433/54024331464.20250407101024.jpg\",\"lprice\":\"2309980\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"54024331464\",\"productType\":\"1\",\"brand\":\"갤럭시북5 프로\",\"maker\":\"삼성전자\",\"category1\":\"디지털/가전\",\"category2\":\"노트북\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"ASUS 젠북 A14 퀄컴 스냅드래곤X 초경량 사무용 대학생 업무용 노트북 Win11\",\"link\":\"https://smartstore.naver.com/main/products/11359933656\",\"image\":\"https://shopping-phinf.pstatic.net/main_8890444/88904444007.jpg\",\"lprice\":\"1166000\",\"hprice\":\"\",\"mallName\":\"ASUS공식총판 에스라이즈\",\"productId\":\"88904444007\",\"productType\":\"2\",\"brand\":\"ASUS\",\"maker\":\"ASUS\",\"category1\":\"디지털/가전\",\"category2\":\"노트북\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"삼성전자 갤럭시북5 프로360 NT960QHA-KC71G\",\"link\":\"https://search.shopping.naver.com/catalog/51340833624\",\"image\":\"https://shopping-phinf.pstatic.net/main_5134083/51340833624.20241111121622.jpg\",\"lprice\":\"2224980\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"51340833624\",\"productType\":\"1\",\"brand\":\"갤럭시북5 프로360\",\"maker\":\"삼성전자\",\"category1\":\"디지털/가전\",\"category2\":\"노트북\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"주연테크 캐리북e J3GW\",\"link\":\"https://search.shopping.naver.com/catalog/24875454523\",\"image\":\"https://shopping-phinf.pstatic.net/main_2487545/24875454523.20201117114806.jpg\",\"lprice\":\"219000\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"24875454523\",\"productType\":\"1\",\"brand\":\"주연테크\",\"maker\":\"주연테크\",\"category1\":\"디지털/가전\",\"category2\":\"노트북\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"엘지 그램 14세대 울트라 7 AI 인공지능 32GB 1TB 17Z90S 터치 병행\",\"link\":\"https://smartstore.naver.com/main/products/7049938391\",\"image\":\"https://shopping-phinf.pstatic.net/main_8459443/84594438713.11.jpg\",\"lprice\":\"1749000\",\"hprice\":\"\",\"mallName\":\"G-스토어\",\"productId\":\"84594438713\",\"productType\":\"2\",\"brand\":\"LG그램\",\"maker\":\"LG전자\",\"category1\":\"디지털/가전\",\"category2\":\"노트북\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"삼성전자 갤럭시북4 NT750XGR-A71A 사무용 업무용 i7 노트북\",\"link\":\"https://smartstore.naver.com/main/products/10093514318\",\"image\":\"https://shopping-phinf.pstatic.net/main_8763801/87638016995.14.jpg\",\"lprice\":\"1098000\",\"hprice\":\"\",\"mallName\":\"삼성공식파트너 코인비엠에스\",\"productId\":\"87638016995\",\"productType\":\"3\",\"brand\":\"갤럭시북4\",\"maker\":\"삼성전자\",\"category1\":\"디지털/가전\",\"category2\":\"노트북\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"레노버 아이디어패드 Slim3 15ABR8 82XM00ELKR RAM 16GB, 512GB\",\"link\":\"https://search.shopping.naver.com/catalog/54909327778\",\"image\":\"https://shopping-phinf.pstatic.net/main_5490932/54909327778.20250522125003.jpg\",\"lprice\":\"559000\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"54909327778\",\"productType\":\"1\",\"brand\":\"아이디어패드\",\"maker\":\"레노버\",\"category1\":\"디지털/가전\",\"category2\":\"노트북\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"MSI 게이밍노트북 17 영상편집 캐드 고사양 i9 13980HX RTX 4070 노트북\",\"link\":\"https://smartstore.naver.com/main/products/11205471249\",\"image\":\"https://shopping-phinf.pstatic.net/main_8874998/88749981580.1.jpg\",\"lprice\":\"1999000\",\"hprice\":\"\",\"mallName\":\"에이치텍 스토어\",\"productId\":\"88749981580\",\"productType\":\"2\",\"brand\":\"MSI\",\"maker\":\"MSI\",\"category1\":\"디지털/가전\",\"category2\":\"노트북\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"삼성전자 갤럭시북3 NT750XFT-A51A\",\"link\":\"https://search.shopping.naver.com/catalog/39746112618\",\"image\":\"https://shopping-phinf.pstatic.net/main_3974611/39746112618.20230502165309.jpg\",\"lprice\":\"798990\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"39746112618\",\"productType\":\"1\",\"brand\":\"갤럭시북3\",\"maker\":\"삼성전자\",\"category1\":\"디지털/가전\",\"category2\":\"노트북\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"삼성전자 갤럭시북4 NT750XGQ-A51A\",\"link\":\"https://search.shopping.naver.com/catalog/46633068618\",\"image\":\"https://shopping-phinf.pstatic.net/main_4663306/46633068618.20240325185204.jpg\",\"lprice\":\"1098990\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"46633068618\",\"productType\":\"1\",\"brand\":\"갤럭시북4\",\"maker\":\"삼성전자\",\"category1\":\"디지털/가전\",\"category2\":\"노트북\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"LG전자 울트라PC 15UD50R-GX56K 8GB, 256GB\",\"link\":\"https://search.shopping.naver.com/catalog/54398511102\",\"image\":\"https://shopping-phinf.pstatic.net/main_5439851/54398511102.20250424175153.jpg\",\"lprice\":\"558890\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"54398511102\",\"productType\":\"1\",\"brand\":\"울트라PC\",\"maker\":\"LG전자\",\"category1\":\"디지털/가전\",\"category2\":\"노트북\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"LG전자 그램 프로 16ZD90SP-GX56K 16GB, 256GB\",\"link\":\"https://search.shopping.naver.com/catalog/52647379133\",\"image\":\"https://shopping-phinf.pstatic.net/main_5264737/52647379133.20250124115648.jpg\",\"lprice\":\"1466380\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"52647379133\",\"productType\":\"1\",\"brand\":\"그램 프로\",\"maker\":\"LG전자\",\"category1\":\"디지털/가전\",\"category2\":\"노트북\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"LG전자 LG그램 15ZD90T-GX59K 32GB, 256GB\",\"link\":\"https://search.shopping.naver.com/catalog/54672053704\",\"image\":\"https://shopping-phinf.pstatic.net/main_5467205/54672053704.20250509164753.jpg\",\"lprice\":\"1668940\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"54672053704\",\"productType\":\"1\",\"brand\":\"LG그램\",\"maker\":\"LG전자\",\"category1\":\"디지털/가전\",\"category2\":\"노트북\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"HP OMEN 16-xf0052ax 16GB, 1TB\",\"link\":\"https://search.shopping.naver.com/catalog/53663904780\",\"image\":\"https://shopping-phinf.pstatic.net/main_5366390/53663904780.20250320095528.jpg\",\"lprice\":\"1888950\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53663904780\",\"productType\":\"1\",\"brand\":\"HP\",\"maker\":\"HP\",\"category1\":\"디지털/가전\",\"category2\":\"노트북\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"삼성노트북 2024 갤럭시북4 NT750XGR-A51A SSD 총 512GB 윈도우11홈\",\"link\":\"https://smartstore.naver.com/main/products/10164369375\",\"image\":\"https://shopping-phinf.pstatic.net/main_8770887/87708872717.jpg\",\"lprice\":\"949000\",\"hprice\":\"\",\"mallName\":\"더하기Shop\",\"productId\":\"87708872717\",\"productType\":\"2\",\"brand\":\"갤럭시북4\",\"maker\":\"삼성전자\",\"category1\":\"디지털/가전\",\"category2\":\"노트북\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"삼성전자 갤럭시북5 프로360 NT960QHA-KD72 32GB, 1TB\",\"link\":\"https://search.shopping.naver.com/catalog/53666908447\",\"image\":\"https://shopping-phinf.pstatic.net/main_5366690/53666908447.20250320160726.jpg\",\"lprice\":\"2698990\",\"hprice\":\"\",\"mallName\":\"네이버\",\"productId\":\"53666908447\",\"productType\":\"1\",\"brand\":\"갤럭시북5 프로360\",\"maker\":\"삼성전자\",\"category1\":\"디지털/가전\",\"category2\":\"노트북\",\"category3\":\"\",\"category4\":\"\"},{\"title\":\"LG그램 노트북 가벼운 가성비 그램 AI AMD 크라켄5 16GB\",\"link\":\"https://smartstore.naver.com/main/products/11859744023\",\"image\":\"https://shopping-phinf.pstatic.net/main_8940425/89404254616.jpg\",\"lprice\":\"1199000\",\"hprice\":\"\",\"mallName\":\"카인드스토어몰\",\"productId\":\"89404254616\",\"productType\":\"2\",\"brand\":\"LG전자\",\"maker\":\"LG전자\",\"category1\":\"디지털/가전\",\"category2\":\"노트북\",\"category3\":\"\",\"category4\":\"\"}]");
function getUniqueCategories() {
	const categories = {};
	items_default.forEach((item) => {
		const cat1 = item.category1;
		const cat2 = item.category2;
		if (!categories[cat1]) categories[cat1] = {};
		if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {};
	});
	return categories;
}
function filterProducts(products, query) {
	let filtered = [...products];
	if (query.search) {
		const searchTerm = query.search.toLowerCase();
		filtered = filtered.filter((item) => item.title.toLowerCase().includes(searchTerm) || item.brand.toLowerCase().includes(searchTerm));
	}
	if (query.category1) filtered = filtered.filter((item) => item.category1 === query.category1);
	if (query.category2) filtered = filtered.filter((item) => item.category2 === query.category2);
	if (query.sort) switch (query.sort) {
		case "price_asc":
			filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
			break;
		case "price_desc":
			filtered.sort((a, b) => parseInt(b.lprice) - parseInt(a.lprice));
			break;
		case "name_asc":
			filtered.sort((a, b) => a.title.localeCompare(b.title, "ko"));
			break;
		case "name_desc":
			filtered.sort((a, b) => b.title.localeCompare(a.title, "ko"));
			break;
		default: filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
	}
	return filtered;
}
function mockGetProducts(params = {}) {
	const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
	const page = params.current ?? params.page ?? 1;
	const filteredProducts = filterProducts(items_default, {
		search,
		category1,
		category2,
		sort
	});
	const startIndex = (page - 1) * limit;
	const endIndex = startIndex + limit;
	const paginatedProducts = filteredProducts.slice(startIndex, endIndex);
	return {
		products: paginatedProducts,
		pagination: {
			page,
			limit,
			total: filteredProducts.length,
			totalPages: Math.ceil(filteredProducts.length / limit),
			hasNext: endIndex < filteredProducts.length,
			hasPrev: page > 1
		},
		filters: {
			search,
			category1,
			category2,
			sort
		}
	};
}
function mockGetProduct(productId) {
	const product = items_default.find((item) => item.productId === productId);
	if (!product) throw new Error("Product not found");
	return {
		...product,
		description: `${product.title}에 대한 상세 설명입니다. ${product.brand} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
		rating: Math.floor(Math.random() * 2) + 4,
		reviewCount: Math.floor(Math.random() * 1e3) + 50,
		stock: Math.floor(Math.random() * 100) + 10,
		images: [
			product.image,
			product.image.replace(".jpg", "_2.jpg"),
			product.image.replace(".jpg", "_3.jpg")
		]
	};
}
function mockGetCategories() {
	return getUniqueCategories();
}
var ServerRouter = class {
	constructor(baseUrl = "") {
		this.routes = /* @__PURE__ */ new Map();
		this.baseUrl = baseUrl.replace(/\/$/, "");
		this.initRoutes();
	}
	initRoutes() {
		this.addRoute("/", HomePage);
		this.addRoute("/product/:id/", ProductDetailPage);
		this.addRoute("/.*", NotFoundPage);
	}
	addRoute(path, handler) {
		const paramNames = [];
		const regexPath = path.replace(/:\w+/g, (match) => {
			paramNames.push(match.slice(1));
			return "([^/]+)";
		}).replace(/\//g, "\\/");
		const regex = /* @__PURE__ */ new RegExp(`^${this.baseUrl}${regexPath}$`);
		this.routes.set(path, {
			regex,
			paramNames,
			handler
		});
	}
	findRoute(url) {
		const pathname = new URL(url, "http://localhost").pathname;
		const cleanPathname = this.baseUrl ? pathname.replace(/* @__PURE__ */ new RegExp(`^${this.baseUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`), "") : pathname;
		const targetPath = cleanPathname || "/";
		const specificRoutes = ["/", "/product/:id/"];
		for (const routePath of specificRoutes) if (this.routes.has(routePath)) {
			const route = this.routes.get(routePath);
			const paramNames = [];
			const regexPath = routePath.replace(/:\w+/g, (match$1) => {
				paramNames.push(match$1.slice(1));
				return "([^/]+)";
			}).replace(/\//g, "\\/");
			const cleanRegex = /* @__PURE__ */ new RegExp(`^${regexPath}$`);
			const match = targetPath.match(cleanRegex);
			if (match) {
				const params = {};
				paramNames.forEach((name, index) => {
					params[name] = match[index + 1];
				});
				return {
					...route,
					params,
					path: routePath
				};
			}
		}
		return null;
	}
};
async function prefetchData(route, query, params) {
	try {
		if (route.path === "/") {
			const productsData = mockGetProducts(query);
			const categories = mockGetCategories();
			productStore.dispatch({
				type: PRODUCT_ACTIONS.SETUP,
				payload: {
					products: productsData.products,
					categories,
					totalCount: productsData.pagination.total,
					loading: false,
					status: "done",
					error: null
				}
			});
			return {
				products: productsData.products,
				categories,
				totalCount: productsData.pagination.total
			};
		} else if (route.path === "/product/:id/") {
			const productId = params.id;
			const product = mockGetProduct(productId);
			productStore.dispatch({
				type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
				payload: product
			});
			let relatedProducts = [];
			if (product.category2) try {
				const relatedData = mockGetProducts({
					category2: product.category2,
					limit: 20,
					page: 1
				});
				relatedProducts = relatedData.products.filter((p) => p.productId !== productId);
				productStore.dispatch({
					type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
					payload: relatedProducts
				});
			} catch (error) {
				console.error("관련 상품 로드 실패:", error);
			}
			return {
				currentProduct: product,
				relatedProducts
			};
		}
		return null;
	} catch (error) {
		console.error("데이터 프리페칭 오류:", error);
		return null;
	}
}
async function render(url) {
	try {
		productStore.dispatch({
			type: PRODUCT_ACTIONS.SETUP,
			payload: initialProductState
		});
		const baseUrl = process.env.NODE_ENV === "production" ? BASE_URL : "";
		const serverRouter = new ServerRouter(baseUrl);
		const route = serverRouter.findRoute(url);
		console.log("Requested URL:", url);
		console.log("Base URL:", baseUrl);
		console.log("Found route:", route);
		if (!route) return {
			html: NotFoundPage(),
			head: "<title>404 - Page Not Found</title>",
			initialData: null
		};
		const query = Router.parseQuery(new URL(url, "http://localhost").search);
		const params = route.params;
		global.router = {
			query,
			params,
			baseUrl
		};
		const initialData = await prefetchData(route, query, params);
		let pageHtml;
		let pageTitle = "쇼핑몰";
		if (route.path === "/") {
			pageHtml = HomePage();
			pageTitle = "쇼핑몰 - 홈";
		} else if (route.path === "/product/:id/") {
			pageHtml = ProductDetailPage();
			const productName = initialData?.currentProduct?.title || "상품";
			pageTitle = `${productName} - 쇼핑몰`;
		} else {
			pageHtml = NotFoundPage();
			pageTitle = "404 - Page Not Found";
		}
		return {
			html: pageHtml,
			head: `<title>${pageTitle}</title>`,
			initialData
		};
	} catch (error) {
		console.error("SSR Error:", error);
		return {
			html: "<div>서버 렌더링 중 오류가 발생했습니다.</div>",
			head: "<title>오류 - 쇼핑몰</title>",
			initialData: null
		};
	}
}
export { render };
