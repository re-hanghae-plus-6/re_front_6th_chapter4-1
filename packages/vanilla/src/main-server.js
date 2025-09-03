import { HomePage, ProductDetailPage, ProductDetail } from "./pages";
import { PageWrapper } from "./pages/PageWrapper.js";
import { getCategories, getProducts, getProduct } from "./api/productApi.js";
import { ServerRouter } from "./lib";

export const render = async (url, query) => {
  // ServerRouter 인스턴스 생성
  const router = new ServerRouter();

  // 라우트 등록 (render.js와 동일하게)
  router.addRoute("/", HomePage);
  router.addRoute("/product/:id/", ProductDetailPage);

  router.start(url, query);
  // URL에 맞는 라우트 찾기
  const route = router.findRoute(url);
  console.log("🎯 라우트:", route);

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

    // 🎯 기존 컴포넌트 재사용으로 하드코딩 제거
    const headerLeft = `
      <button onclick="window.history.back()" 
              class="p-2 text-gray-700 hover:text-gray-900 transition-colors">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
        </svg>
      </button>
      <h1 class="text-lg font-bold text-gray-900">상품 상세</h1>
    `;

    htmlContent = PageWrapper({
      headerLeft,
      children: ProductDetail({ product, relatedProducts }),
    });
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
