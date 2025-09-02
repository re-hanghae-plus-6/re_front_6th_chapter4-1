import { cartStore, productStore } from "../stores";
import { router } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";

/**
 * 서버 HTML의 구체적인 DOM 요소들에 이벤트 리스너를 연결합니다.
 * Hydration 과정에서 실행되어 서버 HTML을 동적으로 만듭니다.
 */
export function reconnectEvents() {
  // 장바구니 추가 버튼들에 이벤트 연결
  const addToCartButtons = document.querySelectorAll('[data-action="add-to-cart"]');

  addToCartButtons.forEach((button) => {
    button.addEventListener("click", (e) => {
      console.log("🛒 장바구니 버튼 클릭됨:", button.dataset.productId);
      e.preventDefault();
      const productId = button.dataset.productId;
      if (productId) {
        // 장바구니에 상품 추가 로직
        const product = productStore.getState().products.find((p) => p.id === productId);
        if (product) {
          cartStore.dispatch({ type: "ADD_TO_CART", payload: product });
        }
      }
    });
  });

  // 검색 입력창에 이벤트 연결
  const searchInput = document.querySelector('[data-action="search"]');
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const searchQuery = e.target.value;
      router.navigate("/", { search: searchQuery });
    });
  }

  // 카테고리 필터에 이벤트 연결
  document.querySelectorAll('[data-action="category-filter"]').forEach((select) => {
    select.addEventListener("change", (e) => {
      const category = e.target.value;
      const categoryType = select.dataset.categoryType; // category1 또는 category2
      if (categoryType) {
        router.navigate("/", { [categoryType]: category });
      }
    });
  });

  // 카테고리 버튼들에 이벤트 연결
  document.querySelectorAll('[data-action="category-filter"]').forEach((button) => {
    button.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const category1 = button.dataset.category1;
      const category2 = button.dataset.category2;
      const breadcrumb = button.dataset.breadcrumb;

      if (breadcrumb === "reset") {
        router.navigate("/", {});
      } else if (category1 && category2) {
        router.navigate("/", { category1, category2 });
      } else if (category1) {
        router.navigate("/", { category1 });
      }
    });
  });

  // 정렬 옵션에 이벤트 연결
  const sortSelect = document.querySelector('[data-action="sort"]');
  if (sortSelect) {
    sortSelect.addEventListener("change", (e) => {
      const sort = e.target.value;
      router.navigate("/", { sort });
    });
  }

  // limit 옵션에 이벤트 연결
  const limitSelect = document.querySelector('[data-action="limit"]');
  if (limitSelect) {
    limitSelect.addEventListener("change", (e) => {
      const limit = e.target.value;
      router.navigate("/", { limit });
    });
  }

  // // 페이지네이션에 이벤트 연결
  // document.querySelectorAll('[data-action="pagination"]').forEach((button) => {
  //   button.addEventListener("click", (e) => {
  //     e.preventDefault();
  //     const page = button.dataset.page;
  //     if (page) {
  //       router.navigate("/", { page });
  //     }
  //   });
  // });

  // 더보기 버튼에 이벤트 연결
  const loadMoreButton = document.querySelector('[data-action="load-more"]');
  if (loadMoreButton) {
    loadMoreButton.addEventListener("click", (e) => {
      e.preventDefault();
      loadProducts(true); // 추가 데이터 로드
    });
  }

  // 상품 카드 클릭 시 상세 페이지로 이동
  const productCards = document.querySelectorAll('[data-action="product-detail"]');

  productCards.forEach((card) => {
    card.addEventListener("click", (e) => {
      console.log("📱 상품 카드 클릭됨:", card.dataset.productId);
      e.preventDefault();
      const productId = card.dataset.productId;
      if (productId) {
        console.log("🚀 라우터 네비게이션 시도:", `/product/${productId}/`);
        router.navigate(`/product/${productId}/`);
      }
    });
  });

  // 무한 스크롤 이벤트 연결
  const scrollTrigger = document.getElementById("scroll-trigger");
  if (scrollTrigger) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          // 스크롤 트리거가 보이면 추가 데이터 로드
          loadProducts(true);
        }
      });
    });
    observer.observe(scrollTrigger);
  }

  // 재시도 버튼에 이벤트 연결
  const retryButton = document.getElementById("retry-btn");
  if (retryButton) {
    retryButton.addEventListener("click", (e) => {
      e.preventDefault();
      loadProductsAndCategories();
    });
  }
}
