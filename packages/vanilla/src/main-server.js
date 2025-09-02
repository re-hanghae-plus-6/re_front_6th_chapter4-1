import { HomePage, ProductDetailPage } from "./pages/index.js";
import { getCategories, getProducts, getProduct } from "./api/productApi.js";
import { ServerRouter } from "./lib/index.js";

export const render = async (url, query) => {
  // ServerRouter 인스턴스 생성
  const router = new ServerRouter();

  // 라우트 등록 (render.js와 동일하게)
  router.addRoute("/", HomePage);
  router.addRoute("/product/:id/", ProductDetailPage);

  // URL에 맞는 라우트 찾기
  const route = router.findRoute(url);

  let pageTitle = "쇼핑몰 - 홈";
  let initialData = {};
  let htmlContent = "";

  if (route && route.path === "/product/:id/") {
    // 상품 상세 페이지
    const productId = route.params.id;
    const product = await getProduct(productId);

    // 관련 상품도 로드 (같은 category2)
    const relatedProductsResponse = await getProducts({
      category2: product.category2,
      limit: 20,
    });
    const relatedProducts = relatedProductsResponse.products.filter((p) => p.productId !== productId);

    pageTitle = `${product.title} - 쇼핑몰`;
    initialData = {
      product,
      relatedProducts: relatedProducts.slice(0, 20),
    };

    // SSR용 완전한 상품 상세 HTML (E2E 테스트 요구사항 충족)
    htmlContent = `
      <div class="min-h-screen bg-gray-50">
        <!-- 헤더 -->
        <header class="bg-white shadow-sm">
          <div class="container mx-auto px-4 py-4">
            <div class="flex items-center space-x-3">
              <button onclick="window.history.back()" 
                      class="p-2 text-gray-700 hover:text-gray-900 transition-colors">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                </svg>
              </button>
              <h1 class="text-lg font-bold text-gray-900">상품 상세</h1>
            </div>
          </div>
        </header>
        
        <!-- 상품 상세 내용 -->
        <div class="container mx-auto px-4 py-8">
          <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
            <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
              <img src="${product.image}" alt="${product.title}" class="w-full h-full object-cover">
            </div>
            <p class="text-sm text-gray-600 mb-1">${product.brand}</p>
            <h1 class="text-xl font-bold text-gray-900 mb-3">${product.title}</h1>
            <div class="mb-4">
              <span class="text-2xl font-bold text-blue-600">${Number(product.lprice).toLocaleString()}원</span>
            </div>
            
            <!-- 수량 선택 및 액션 -->
            <div class="border-t border-gray-200 pt-4">
              <button data-action="add-to-cart" data-product-id="${product.productId}"
                      class="w-full bg-blue-600 text-white py-3 px-4 rounded-md 
                             hover:bg-blue-700 transition-colors font-medium">
                장바구니 담기
              </button>
            </div>
          </div>
          
          <!-- 관련 상품 섹션 -->
          ${
            relatedProducts.length > 0
              ? `
          <div class="bg-white rounded-lg shadow-sm">
            <div class="p-4 border-b border-gray-200">
              <h2 class="text-lg font-bold text-gray-900">관련 상품</h2>
            </div>
            <div class="p-4">
              <div class="grid grid-cols-2 gap-3">
                ${relatedProducts
                  .slice(0, 4)
                  .map(
                    (relatedProduct) => `
                <div class="bg-gray-50 rounded-lg p-3" data-product-id="${relatedProduct.productId}">
                  <div class="aspect-square bg-white rounded-md overflow-hidden mb-2">
                    <img src="${relatedProduct.image}" alt="${relatedProduct.title}" 
                         class="w-full h-full object-cover">
                  </div>
                  <h3 class="text-sm font-medium text-gray-900 mb-1">${relatedProduct.title}</h3>
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
        </div>
      </div>
    `;
  } else {
    // 홈페이지 (기본)
    const [
      {
        products,
        pagination: { total },
      },
      categories,
    ] = await Promise.all([getProducts(query), getCategories()]);

    initialData = {
      products,
      categories,
      totalCount: total,
    };

    htmlContent = HomePage(url, query, {
      ...initialData,
      loading: false,
      status: "done",
    });
  }

  return {
    head: `<title>${pageTitle}</title>`,
    html: htmlContent,
    data: initialData,
  };
};
