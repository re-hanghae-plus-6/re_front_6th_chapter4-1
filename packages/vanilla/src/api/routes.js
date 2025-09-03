/**
 * API 라우트 설정 - 모든 API 엔드포인트를 중앙에서 관리
 */

/**
 * 상품 목록 API 핸들러
 */
async function getProductsHandler(req, res) {
  const items = await import("../mocks/items.json", { with: { type: "json" } });
  let products = [...(items.default || [])];

  // MSW 핸들러와 동일한 필터링 및 정렬 로직
  const { search = "", category1 = "", category2 = "", sort = "price_asc" } = req.query;

  // 검색 필터
  if (search) {
    products = products.filter(
      (item) =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.brand.toLowerCase().includes(search.toLowerCase()),
    );
  }

  // 카테고리 필터
  if (category1) {
    products = products.filter((item) => item.category1 === category1);
  }
  if (category2) {
    products = products.filter((item) => item.category2 === category2);
  }

  // 정렬 (기본값: price_asc)
  const sortType = sort || "price_asc";
  switch (sortType) {
    case "price_asc":
      products.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
      break;
    case "price_desc":
      products.sort((a, b) => parseInt(b.lprice) - parseInt(a.lprice));
      break;
    case "name_asc":
      products.sort((a, b) => a.title.localeCompare(b.title, "ko"));
      break;
    case "name_desc":
      products.sort((a, b) => b.title.localeCompare(a.title, "ko"));
      break;
    default:
      products.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
  }

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
