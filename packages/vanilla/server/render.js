import { getCategories, getProduct, getProducts } from "../src/api/productApi.js";

/**
 * 서버 사이드 렌더링 함수
 */
export const render = async (url, query, vite = null) => {
  console.log("🚀 SSR Render 시작:", { url, query, timestamp: new Date().toISOString() });

  try {
    // URL에 따라 다른 데이터 로딩
    if (url.startsWith("/product/")) {
      console.log("📦 상품 상세 페이지 렌더링");
      return await renderProductDetail(url, query, vite);
    } else {
      console.log("🏠 홈페이지 렌더링");
      return await renderHomePage(query, vite);
    }
  } catch (error) {
    console.error("❌ SSR Render Error:", error);
    return renderErrorPage(error);
  }
};

/**
 * 홈페이지 렌더링
 */
const renderHomePage = async (query, vite = null) => {
  console.log("📊 데이터 페칭 시작:", query);

  const [
    {
      products,
      pagination: { total },
    },
    categories,
  ] = await Promise.all([getProducts(query), getCategories()]);

  console.log("✅ 데이터 페칭 완료:", {
    productsCount: products.length,
    totalCount: total,
    categoriesCount: Object.keys(categories).length,
  });

  // SSR용 HomePage 컴포넌트 동적 import
  let HomePage;
  if (vite) {
    console.log("🔧 Vite SSR 모듈 로딩");
    const module = await vite.ssrLoadModule("./src/pages/HomePage.js");
    HomePage = module.HomePage;
  } else {
    console.log("📦 일반 모듈 로딩");
    const module = await import("../src/pages/HomePage.js");
    HomePage = module.HomePage;
  }

  console.log("🎨 컴포넌트 렌더링 시작");
  const html = HomePage("", query, {
    products,
    categories,
    totalCount: total,
    loading: false,
    status: "done",
  });

  console.log("✅ SSR 렌더링 완료, HTML 길이:", html.length);
  return html;
};

/**
 * 상품 상세 페이지 렌더링
 */
const renderProductDetail = async (url, query, vite = null) => {
  const productId = url.split("/product/")[1];

  if (!productId) {
    throw new Error("상품 ID가 없습니다.");
  }

  const [product, categories] = await Promise.all([getProduct(productId), getCategories()]);

  // SSR용 ProductDetailPage 컴포넌트 동적 import
  let ProductDetailPage;
  if (vite) {
    const module = await vite.ssrLoadModule("./src/pages/ProductDetailPage.js");
    ProductDetailPage = module.ProductDetailPage;
  } else {
    const module = await import("../src/pages/ProductDetailPage.js");
    ProductDetailPage = module.ProductDetailPage;
  }

  return ProductDetailPage(url, query, {
    product,
    categories,
    loading: false,
    status: "done",
  });
};

/**
 * 에러 페이지 렌더링
 */
const renderErrorPage = (error) => {
  return `
    <div class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <h1 class="text-2xl font-bold text-red-600 mb-4">오류가 발생했습니다</h1>
        <p class="text-gray-600">${error.message}</p>
      </div>
    </div>
  `;
};
