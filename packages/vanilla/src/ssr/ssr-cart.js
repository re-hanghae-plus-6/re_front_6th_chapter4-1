// packages/vanilla/src/ssr-cart.js
import { HomePage } from "../pages/HomePage.js";
import { CartModal } from "./components/CartModal.js";

export const generateCartHTML = ({ products, cartItems, categories }) => `
  <!DOCTYPE html>
  <html lang="ko">
  <head>
    <meta charset="UTF-8">
    <title>쇼핑몰</title>
    <link rel="stylesheet" href="/src/styles.css">
  </head>
  <body>
    <div id="root">
      ${HomePage({ products, categories })}  // 서버에서 미리 렌더링된 홈페이지
    </div>
    
    <!-- 장바구니 모달 (초기에는 숨김) -->
    <div id="cart-modal-container">
      ${CartModal({ items: cartItems, isOpen: false })}
    </div>
    
    <script type="module" src="/src/main.js"></script>
    <script>
      window.__INITIAL_DATA__ = ${JSON.stringify({
        products,
        cartItems,
        categories,
      })};
    </script>
  </body>
  </html>
`;
