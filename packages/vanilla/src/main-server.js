import { createStore } from "./lib/createStore.js";
import { PRODUCT_ACTIONS } from "./stores/actionTypes.js";
import { getCategories, getProduct, getProducts } from "./api/productApi.js";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages/index.js";
import { PageWrapper } from "./pages/PageWrapper.js";

/**
 * 서버 사이드 라우터
 */
class ServerRouter {
  constructor() {
    this.routes = new Map();
  }

  addRoute(path, handler) {
    const paramNames = [];
    // 앞의 /를 제거하고 정규식 생성 (서버에서 base를 제거한 URL과 매칭하기 위해)
    const pathWithoutSlash = path.startsWith("/") ? path.slice(1) : path;
    let regexPath = pathWithoutSlash
      .replace(/:\w+/g, (match) => {
        paramNames.push(match.slice(1));
        return "([^/]+)";
      })
      .replace(/\//g, "\\/");

    // 홈페이지 라우트 (/)의 경우 빈 문자열과 슬래시 모두 매칭하도록 수정
    if (path === "/") {
      regexPath = "(?:^$|^\\/$)";
    }

    const regex = new RegExp(`^${regexPath}$`);

    console.log(`라우트 등록: ${path} -> ${regex}`);

    this.routes.set(path, {
      regex,
      paramNames,
      handler,
    });
  }

  findRoute(url) {
    const pathname = url.split("?")[0]; // 쿼리 파라미터 제거
    const normalizedPath = pathname === "" ? "/" : pathname; // 빈 문자열을 "/"로 정규화

    console.log("라우트 찾기:", normalizedPath);
    console.log("등록된 라우트들:", Array.from(this.routes.keys()));

    // 구체적인 라우트부터 먼저 확인 (.* 라우트는 마지막에)
    const routeOrder = ["/", "/product/:id/", ".*"];

    for (const routePath of routeOrder) {
      const route = this.routes.get(routePath);
      if (route) {
        const match = normalizedPath.match(route.regex);
        console.log(`라우트 ${routePath} 매칭 시도:`, match);
        if (match) {
          const params = {};
          route.paramNames.forEach((name, index) => {
            params[name] = match[index + 1];
          });

          console.log("매칭된 라우트:", routePath, "파라미터:", params);
          return {
            ...route,
            params,
            path: routePath,
          };
        }
      }
    }
    return null;
  }
}

// 서버 라우터 초기화
const serverRouter = new ServerRouter();
serverRouter.addRoute("/", HomePage);
serverRouter.addRoute("/product/:id/", ProductDetailPage);
serverRouter.addRoute(".*", NotFoundPage);

/**
 * 서버에서 데이터 프리페칭
 */
async function prefetchData(route, params, query) {
  const productStore = createStore(
    (state, action) => {
      switch (action.type) {
        case PRODUCT_ACTIONS.SET_STATUS:
          return { ...state, status: action.payload };
        case PRODUCT_ACTIONS.SET_CATEGORIES:
          return { ...state, categories: action.payload, loading: false, error: null, status: "done" };
        case PRODUCT_ACTIONS.SET_PRODUCTS:
          return {
            ...state,
            products: action.payload.products,
            totalCount: action.payload.totalCount,
            loading: false,
            error: null,
            status: "done",
          };
        case PRODUCT_ACTIONS.SET_CURRENT_PRODUCT:
          return { ...state, currentProduct: action.payload, loading: false, error: null, status: "done" };
        case PRODUCT_ACTIONS.SET_RELATED_PRODUCTS:
          return { ...state, relatedProducts: action.payload, status: "done" };
        case PRODUCT_ACTIONS.SETUP:
          return { ...state, ...action.payload };
        default:
          return state;
      }
    },
    {
      products: [],
      totalCount: 0,
      currentProduct: null,
      relatedProducts: [],
      loading: true,
      error: null,
      status: "idle",
      categories: {},
    },
  );

  try {
    if (route.path === "/") {
      // 홈페이지: 상품 목록과 카테고리 로드
      const [productsResponse, categories] = await Promise.all([getProducts(query), getCategories()]);

      productStore.dispatch({
        type: PRODUCT_ACTIONS.SETUP,
        payload: {
          products: productsResponse.products,
          totalCount: productsResponse.pagination.total,
          categories,
          loading: false,
          status: "done",
        },
      });
    } else if (route.path === "/product/:id/") {
      // 상품 상세 페이지: 상품 정보와 관련 상품 로드
      console.log("상품 상세 페이지 프리페칭 시작:", params.id);

      try {
        const product = await getProduct(params.id);
        console.log("상품 데이터 로드 완료:", product?.title);

        productStore.dispatch({
          type: PRODUCT_ACTIONS.SET_CURRENT_PRODUCT,
          payload: product,
        });

        // 관련 상품 로드
        if (product.category2) {
          console.log("관련 상품 로드 시작:", product.category2);
          const relatedResponse = await getProducts({
            category2: product.category2,
            limit: 20,
            page: 1,
          });

          const relatedProducts = relatedResponse.products.filter((p) => p.productId !== params.id);
          console.log("관련 상품 로드 완료:", relatedProducts.length, "개");

          productStore.dispatch({
            type: PRODUCT_ACTIONS.SET_RELATED_PRODUCTS,
            payload: relatedProducts,
          });
        }
      } catch (productError) {
        console.error("상품 상세 페이지 프리페칭 오류:", productError);
        throw productError;
      }
    }
  } catch (error) {
    console.error("서버 데이터 프리페칭 실패:", error);
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: {
        loading: false,
        error: error.message,
        status: "done",
      },
    });
  }

  return productStore.getState();
}

/**
 * 서버에서 상품 상세 페이지 렌더링
 */
function renderProductDetailPage(product, relatedProducts = []) {
  const {
    productId,
    title,
    image,
    lprice,
    brand,
    description = "",
    rating = 0,
    reviewCount = 0,
    stock = 100,
    category1,
    category2,
  } = product;

  const price = Number(lprice);

  // 브레드크럼 생성
  const breadcrumbItems = [];
  if (category1) breadcrumbItems.push({ name: category1, category: "category1", value: category1 });
  if (category2) breadcrumbItems.push({ name: category2, category: "category2", value: category2 });

  const productDetailHtml = `
    <!-- 브레드크럼 -->
    ${
      breadcrumbItems.length > 0
        ? `
      <nav class="mb-4">
        <div class="flex items-center space-x-2 text-sm text-gray-600">
          <a href="/" data-link class="hover:text-blue-600 transition-colors">홈</a>
          ${breadcrumbItems
            .map(
              (item) => `
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
            <button class="breadcrumb-link" data-${item.category}="${item.value}">
              ${item.name}
            </button>
          `,
            )
            .join("")}
        </div>
      </nav>
    `
        : ""
    }

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
          ${
            rating > 0
              ? `
            <div class="flex items-center mb-3">
              <div class="flex items-center">
                ${Array(5)
                  .fill(0)
                  .map(
                    (_, i) => `
                  <svg class="w-4 h-4 ${i < rating ? "text-yellow-400" : "text-gray-300"}" 
                       fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                  </svg>
                `,
                  )
                  .join("")}
              </div>
              <span class="ml-2 text-sm text-gray-600">${rating}.0 (${reviewCount.toLocaleString()}개 리뷰)</span>
            </div>
          `
              : ""
          }
          
          <!-- 가격 -->
          <div class="mb-4">
            <span class="text-2xl font-bold text-blue-600">${price.toLocaleString()}원</span>
          </div>
          
          <!-- 재고 -->
          <div class="text-sm text-gray-600 mb-4">
            재고 ${stock.toLocaleString()}개
          </div>
          
          <!-- 설명 -->
          ${
            description
              ? `
            <div class="text-sm text-gray-700 leading-relaxed mb-6">
              ${description}
            </div>
          `
              : ""
          }
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
    ${
      relatedProducts.length > 0
        ? `
      <div class="bg-white rounded-lg shadow-sm">
        <div class="p-4 border-b border-gray-200">
          <h2 class="text-lg font-bold text-gray-900">관련 상품</h2>
          <p class="text-sm text-gray-600">같은 카테고리의 다른 상품들</p>
        </div>
        <div class="p-4">
          <div class="grid grid-cols-2 gap-3 responsive-grid">
            ${relatedProducts
              .slice(0, 20)
              .map(
                (relatedProduct) => `
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
            `,
              )
              .join("")}
          </div>
        </div>
      </div>
    `
        : ""
    }
  `;

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
    children: productDetailHtml,
  });
}

/**
 * 서버에서 404 페이지 렌더링
 */
function renderNotFoundPage() {
  return PageWrapper({
    headerLeft: `
      <h1 class="text-xl font-bold text-gray-900">
        <a href="/" data-link>쇼핑몰</a>
      </h1>
    `.trim(),
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
    `.trim(),
  });
}

/**
 * 서버 사이드 렌더링
 */
export const render = async (url, query = {}) => {
  console.log("서버 렌더링:", { url, query });

  try {
    // 1. 라우트 매칭
    const route = serverRouter.findRoute(url);
    if (!route) {
      return {
        head: `<title>404 - 페이지를 찾을 수 없습니다</title>`,
        html: `<div class="min-h-screen bg-gray-50 flex items-center justify-center">
          <div class="text-center">
            <h1 class="text-2xl font-bold text-gray-900 mb-4">404</h1>
            <p class="text-gray-600">페이지를 찾을 수 없습니다.</p>
          </div>
        </div>`,
        initialData: {},
      };
    }

    // 2. 데이터 프리페칭
    console.log("라우트 매칭 결과:", route);
    const initialData = await prefetchData(route, route.params, query);

    // 3. 페이지 컴포넌트 렌더링
    let html = "";
    let title = "쇼핑몰";
    let description = "온라인 쇼핑몰";

    if (route.path === "/") {
      title = "쇼핑몰 - 상품 목록";
      description = "다양한 상품을 만나보세요";
      html = route.handler();
    } else if (route.path === "/product/:id/") {
      const product = initialData.currentProduct;
      if (product) {
        title = `${product.title} - 쇼핑몰`;
        description = product.description || `${product.title} 상품 정보`;
      }

      // 서버에서 직접 상품 상세 페이지 렌더링
      if (product) {
        html = renderProductDetailPage(product, initialData.relatedProducts || []);
      } else {
        html = renderNotFoundPage();
      }
    } else {
      html = route.handler();
    }

    return {
      head: `
        <title>${title}</title>
        <meta name="description" content="${description}">
        <meta name="viewport" content="width=device-width, initial-scale=1">
      `,
      html,
      initialData,
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
      initialData: {},
    };
  }
};
