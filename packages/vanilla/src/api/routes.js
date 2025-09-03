/**
 * API 라우트 설정 - 모든 API 엔드포인트를 중앙에서 관리
 */

/**
 * 상품 목록 API 핸들러
 */
async function getProductsHandler(req, res) {
  const items = await import("../mocks/items.json", { with: { type: "json" } });
  const products = items.default || [];

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;

  res.json({
    products: products.slice(startIndex, endIndex),
    pagination: {
      page,
      limit,
      total: products.length,
      totalPages: Math.ceil(products.length / limit),
    },
  });
}

/**
 * 상품 상세 API 핸들러
 */
async function getProductHandler(req, res) {
  const productId = req.params.id;
  const items = await import("../mocks/items.json", { with: { type: "json" } });
  const products = items.default || [];
  const product = products.find((p) => p.productId === productId);

  if (product) {
    res.json({
      ...product,
      description: `${product.title}에 대한 상세 설명입니다.`,
      rating: 4.5,
      reviewCount: 123,
      stock: 50,
    });
  } else {
    res.status(404).json({ error: "Product not found" });
  }
}

/**
 * 카테고리 API 핸들러
 */
async function getCategoriesHandler(req, res) {
  const items = await import("../mocks/items.json", { with: { type: "json" } });
  const products = items.default || [];
  const categories = {};

  products.forEach((product) => {
    if (product.category1) {
      if (!categories[product.category1]) categories[product.category1] = {};
      if (product.category2) {
        categories[product.category1][product.category2] = {};
      }
    }
  });

  res.json(categories);
}

/**
 * API 라우트 설정
 */
export const apiRoutes = [
  {
    method: "GET",
    path: "/products",
    handler: getProductsHandler,
    name: "getProducts",
  },
  {
    method: "GET",
    path: "/products/:id",
    handler: getProductHandler,
    name: "getProduct",
  },
  {
    method: "GET",
    path: "/categories",
    handler: getCategoriesHandler,
    name: "getCategories",
  },
];

/**
 * API 라우트 설정을 기반으로 API 라우터에 라우트 등록
 * @param {ApiRouter} apiRouter - ApiRouter 인스턴스
 */
export function registerApiRoutes(apiRouter) {
  apiRoutes.forEach(({ method, path, handler }) => {
    apiRouter.addRoute(method, path, handler);
  });
}
