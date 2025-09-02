import { getProduct, getProducts, getCategories } from "../api/productApi.js";
import { HomePage, ProductDetailPage } from "../pages/index.js";

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
  ] = await Promise.all([getProducts(query), getCategories()]);

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
    initialData: {
      products,
      categories,
      totalCount: total,
      query,
    },
  };
}

/**
 * Render product detail page for SSR
 */
async function renderProductDetailPage(productId) {
  try {
    // Load product info and related products in parallel
    const product = await getProduct(productId);

    let relatedProducts = [];
    if (product.category2) {
      const relatedResponse = await getProducts({
        category2: product.category2,
        limit: 20,
        page: 1,
      });
      // Exclude current product
      relatedProducts = relatedResponse.products.filter((p) => p.productId !== productId);
    }

    return {
      head: generateProductDetailHead(product),
      html: ProductDetailPage({
        productId,
        product,
        relatedProducts,
        loading: false,
        error: null,
      }),
      initialData: {
        currentProduct: product,
        relatedProducts,
        loading: false,
        error: null,
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
