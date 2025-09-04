import { CartModal, Footer, Toast } from "../../components/index.js";

/**
 * 서버 사이드 렌더링을 위한 PageWrapper
 * 스토어 의존성 없이 순수한 렌더링 함수로 구현
 */
export const ServerPageWrapper = ({ headerLeft, children }) => {
  // 서버에서는 빈 장바구니로 시작
  const cartSize = 0;
  const cartModal = { isOpen: false };
  const toast = { isVisible: false, message: "", type: "info" };

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
                ${cartSize > 0 ? `<span class="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">${cartSize > 99 ? "99+" : cartSize}</span>` : ""}
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main class="max-w-md mx-auto px-4 py-4">
        ${children}
      </main>
      
      ${CartModal({ items: [], isOpen: cartModal.isOpen })}
      
      ${Toast(toast)}
      
      ${Footer()}
    </div>
  `;
};
