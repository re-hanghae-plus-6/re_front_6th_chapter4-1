import { HomePage, ProductDetailPage } from "../pages/index.js";
import items from "../mocks/items.json" with { type: "json" };

// 카테고리 추출 함수
function getUniqueCategories() {
  const categories = {};

  items.forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;

    if (!categories[cat1]) categories[cat1] = {};
    if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {};
  });

  return categories;
}

// 상품 검색 및 필터링 함수
function filterProducts(products, query) {
  let filtered = [...products];

  // 검색어 필터링
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(
      (item) => item.title.toLowerCase().includes(searchTerm) || item.brand.toLowerCase().includes(searchTerm),
    );
  }

  // 카테고리 필터링
  if (query.category1) {
    filtered = filtered.filter((item) => item.category1 === query.category1);
  }
  if (query.category2) {
    filtered = filtered.filter((item) => item.category2 === query.category2);
  }

  // 정렬
  if (query.sort) {
    switch (query.sort) {
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
      default:
        // 기본은 가격 낮은 순
        filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
    }
  }

  return filtered;
}

// Mock API 함수들
function getProductsSSR(params = {}) {
  const { limit = 20, search = "", category1 = "", category2 = "", sort = "price_asc" } = params;
  const page = params.current ?? params.page ?? 1;

  // 필터링된 상품들
  const filteredProducts = filterProducts(items, {
    search,
    category1,
    category2,
    sort,
  });

  // 페이지네이션
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // 응답 데이터
  return {
    products: paginatedProducts,
    pagination: {
      page,
      limit,
      total: filteredProducts.length,
      totalPages: Math.ceil(filteredProducts.length / limit),
      hasNext: endIndex < filteredProducts.length,
      hasPrev: page > 1,
    },
    filters: {
      search,
      category1,
      category2,
      sort,
    },
  };
}

function getProductSSR(productId) {
  const product = items.find((item) => item.productId === productId);

  if (!product) {
    throw new Error("Product not found");
  }

  // 상세 정보에 추가 데이터 포함
  return {
    ...product,
    description: `${product.title}에 대한 상세 설명입니다. ${product.brand} 브랜드의 우수한 품질을 자랑하는 상품으로, 고객 만족도가 높은 제품입니다.`,
    rating: Math.floor(Math.random() * 2) + 4, // 4~5점 랜덤
    reviewCount: Math.floor(Math.random() * 1000) + 50, // 50~1050개 랜덤
    stock: Math.floor(Math.random() * 100) + 10, // 10~110개 랜덤
    images: [product.image, product.image.replace(".jpg", "_2.jpg"), product.image.replace(".jpg", "_3.jpg")],
  };
}

function getCategoriesSSR() {
  return getUniqueCategories();
}

/**
 * Server-side rendering router that returns appropriate page and data based on URL patterns
 */
export const renderPage = async (url, query) => {
  console.log("SSR routing:", { url, query });

  // Parse URL pattern
  const pathSegments = url.split("/").filter((segment) => segment);

  try {
    // Product detail page: /product/:id
    if (pathSegments[0] === "product" && pathSegments[1]) {
      const productId = pathSegments[1];
      return await renderProductDetailPage(productId);
    }

    // Home page: /
    return await renderHomePage(query);
  } catch (error) {
    console.error("SSR rendering error:", error);
    return generateErrorPage(error);
  }
};

/**
 * Render home page for SSR
 */
async function renderHomePage(query) {
  const [
    {
      products,
      pagination: { total },
    },
    categories,
  ] = await Promise.all([getProductsSSR(query), getCategoriesSSR()]);

  const productInfo = {
    products,
    categories,
    totalCount: total,
    loading: false,
    status: "done",
  };

  return {
    head: generateHomePageHead(query),
    html: HomePage({ query, productInfo }),
    initialData: productInfo,
  };
}

/**
 * Render product detail page for SSR
 */
async function renderProductDetailPage(productId) {
  try {
    // Load product info and related products in parallel
    const product = await Promise.resolve(getProductSSR(productId));

    let relatedProducts = [];
    if (product.category2) {
      const relatedResponse = await Promise.resolve(
        getProductsSSR({
          category2: product.category2,
          limit: 20,
          page: 1,
        }),
      );
      // Exclude current product
      relatedProducts = relatedResponse.products.filter((p) => p.productId !== productId);
    }

    const productDetailInfo = {
      currentProduct: product,
      relatedProducts,
      loading: false,
      error: null,
    };

    return {
      head: generateProductDetailHead(product),
      html: ProductDetailPage({
        productId,
        productDetailInfo,
      }),
      initialData: {
        productDetailInfo,
      },
    };
  } catch (error) {
    console.error(`Failed to load product ${productId}:`, error);

    return {
      head: generateErrorHead(),
      html: ProductDetailPage({
        productId,
        product: null,
        relatedProducts: [],
        loading: false,
        error: error.message || "상품을 찾을 수 없습니다.",
      }),
      initialData: {
        currentProduct: null,
        relatedProducts: [],
        loading: false,
        error: error.message || "상품을 찾을 수 없습니다.",
      },
    };
  }
}

/**
 * Generate meta tags for home page
 */
function generateHomePageHead(query) {
  let title = "쇼핑몰 - 홈";

  if (query.search) {
    title = `'${query.search}' 검색 결과 - 쇼핑몰`;
  } else if (query.category1) {
    title = `${query.category1}`;
    if (query.category2) {
      title += ` > ${query.category2}`;
    }
    title += " - 쇼핑몰";
  }

  return `
    <title>${title}</title>
    <meta name="description" content="다양한 상품을 만나보세요">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  `.trim();
}

/**
 * Generate meta tags for product detail page
 */
function generateProductDetailHead(product) {
  const title = `${product.title} - 쇼핑몰`;
  const description = product.description || `${product.title} - ${Number(product.lprice).toLocaleString()}원`;

  return `
    <title>${title}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${product.image}">
  `.trim();
}

/**
 * Generate meta tags for error page
 */
function generateErrorHead() {
  return `
    <title>Product not found - Shopping Mall</title>
    <meta name="description" content="The requested product does not exist">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  `.trim();
}

/**
 * Generate error page
 */
function generateErrorPage(error) {
  return {
    head: generateErrorHead(),
    html: `
      <div class="min-h-screen bg-gray-50 flex items-center justify-center">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900 mb-4">오류가 발생했습니다</h1>
          <p class="text-gray-600 mb-4">${escapeHtml(error.message || "알 수 없는 오류")}</p>
          <a href="/" class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            홈으로 돌아가기
          </a>
        </div>
      </div>
    `,
    initialData: {
      error: error.message,
    },
  };
}

/**
 * HTML escape utility function
 */
function escapeHtml(text) {
  if (typeof text !== "string") return text;
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// SSR용 함수들 export
export { getProductsSSR, getProductSSR, getCategoriesSSR };
