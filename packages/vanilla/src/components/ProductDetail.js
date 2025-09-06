import { ErrorContent } from "./ErrorContent";

export function ProductDetail({ product, relatedProducts = [] }) {
  if (!product) {
    return ErrorContent({ error: "상품 정보를 찾을 수 없습니다." });
  }

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

  return /* HTML */ `
    <!-- 브레드크럼 -->
    ${breadcrumbItems.length > 0
      ? /* HTML */ `
          <nav class="mb-4">
            <div class="flex items-center space-x-2 text-sm text-gray-600">
              <a href="/" data-link class="hover:text-blue-600 transition-colors">홈</a>
              ${breadcrumbItems
                .map(
                  (item) => /* HTML */ `
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <button class="breadcrumb-link" data-${item.category}="${item.value}">${item.name}</button>
                  `,
                )
                .join("")}
            </div>
          </nav>
        `
      : ""}

    <!-- 상품 상세 정보 -->
    <div class="bg-white rounded-lg shadow-sm mb-6">
      <!-- 상품 이미지 -->
      <div class="p-4">
        <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4">
          <img src="${image}" alt="${title}" class="w-full h-full object-cover product-detail-image" />
        </div>

        <!-- 상품 정보 -->
        <div>
          <p class="text-sm text-gray-600 mb-1">${brand}</p>
          <h1 class="text-xl font-bold text-gray-900 mb-3">${title}</h1>

          <!-- 평점 및 리뷰 -->
          ${rating > 0
            ? /* HTML */ `
                <div class="flex items-center mb-3">
                  <div class="flex items-center">
                    ${Array(5)
                      .fill(0)
                      .map(
                        (_, i) => /* HTML */ `
                          <svg
                            class="w-4 h-4 ${i < rating ? "text-yellow-400" : "text-gray-300"}"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                            />
                          </svg>
                        `,
                      )
                      .join("")}
                  </div>
                  <span class="ml-2 text-sm text-gray-600">${rating}.0 (${reviewCount.toLocaleString()}개 리뷰)</span>
                </div>
              `
            : ""}

          <!-- 가격 -->
          <div class="mb-4">
            <span class="text-2xl font-bold text-blue-600">${price.toLocaleString()}원</span>
          </div>

          <!-- 재고 -->
          <div class="text-sm text-gray-600 mb-4">재고 ${stock.toLocaleString()}개</div>

          <!-- 설명 -->
          ${description
            ? /* HTML */ `<div class="text-sm text-gray-700 leading-relaxed mb-6">${description}</div>`
            : ""}
        </div>
      </div>

      <!-- 수량 선택 및 액션 -->
      <div class="border-t border-gray-200 p-4">
        <div class="flex items-center justify-between mb-4">
          <span class="text-sm font-medium text-gray-900">수량</span>
          <div class="flex items-center">
            <button
              id="quantity-decrease"
              class="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-l-md bg-gray-50 hover:bg-gray-100"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
              </svg>
            </button>

            <input
              type="number"
              id="quantity-input"
              value="1"
              min="1"
              max="${stock}"
              class="w-16 h-8 text-center text-sm border-t border-b border-gray-300 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />

            <button
              id="quantity-increase"
              class="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-r-md bg-gray-50 hover:bg-gray-100"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>
        </div>

        <!-- 액션 버튼 -->
        <button
          id="add-to-cart-btn"
          data-product-id="${productId}"
          class="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
        >
          장바구니 담기
        </button>
      </div>
    </div>

    <!-- 상품 목록으로 이동 -->
    <div class="mb-6">
      <button
        class="block w-full text-center bg-gray-100 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-200 transition-colors go-to-product-list"
      >
        상품 목록으로 돌아가기
      </button>
    </div>

    <!-- 관련 상품 -->
    ${relatedProducts.length > 0
      ? /* HTML */ `
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
                    (relatedProduct) => /* HTML */ `
                      <div
                        class="bg-gray-50 rounded-lg p-3 related-product-card cursor-pointer"
                        data-product-id="${relatedProduct.productId}"
                      >
                        <div class="aspect-square bg-white rounded-md overflow-hidden mb-2">
                          <img
                            src="${relatedProduct.image}"
                            alt="${relatedProduct.title}"
                            class="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                        <h3 class="text-sm font-medium text-gray-900 mb-1 line-clamp-2">${relatedProduct.title}</h3>
                        <p class="text-sm font-bold text-blue-600">
                          ${Number(relatedProduct.lprice).toLocaleString()}원
                        </p>
                      </div>
                    `,
                  )
                  .join("")}
              </div>
            </div>
          </div>
        `
      : ""}
  `;
}
