import { HomePage, NotFoundPage, ProductDetailPage } from "./pages/index.js";
import { cartStore } from "./stores/cartStore.js";
import { productStore } from "./stores/productStore.js";
import { PRODUCT_ACTIONS } from "./stores/actionTypes.js";
import { uiStore } from "./stores/uiStore.js";
import { route } from "./router/serverRouter.js";
import items from "./mocks/items.json";

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

function filterProducts(products, query) {
  let filtered = [...products];

  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    filtered = filtered.filter(
      (item) => item.title.toLowerCase().includes(searchTerm) || item.brand.toLowerCase().includes(searchTerm),
    );
  }

  if (query.category1) {
    filtered = filtered.filter((item) => item.category1 === query.category1);
  }
  if (query.category2) {
    filtered = filtered.filter((item) => item.category2 === query.category2);
  }

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
        filtered.sort((a, b) => parseInt(a.lprice) - parseInt(b.lprice));
    }
  }

  return filtered;
}

async function mockGetProducts(query = {}) {
  const normalized = {
    page: Number(query?.page ?? query?.current ?? 1),
    limit: Number(query?.limit ?? 20),
    search: query?.search ?? "",
    category1: query?.category1 ?? "",
    category2: query?.category2 ?? "",
    sort: query?.sort ?? "price_asc",
  };

  const filteredProducts = filterProducts(items, normalized);

  const uptoEnd = Math.min(filteredProducts.length, normalized.page * normalized.limit);
  const productsForResponse = filteredProducts.slice(0, uptoEnd);

  return {
    products: productsForResponse,
    pagination: {
      page: normalized.page,
      limit: normalized.limit,
      total: filteredProducts.length,
      totalPages: Math.ceil(filteredProducts.length / normalized.limit),
      hasNext: uptoEnd < filteredProducts.length,
      hasPrev: normalized.page > 1,
    },
  };
}

async function mockGetProduct(id) {
  const product = items.find((item) => item.productId === id);
  if (!product) return null;

  return {
    ...product,
    description: `${product.title}에 대한 상세 설명입니다.`,
    rating: Math.floor(Math.random() * 2) + 4,
    reviewCount: Math.floor(Math.random() * 1000) + 50,
    stock: Math.floor(Math.random() * 100) + 10,
    images: [product.image, product.image.replace(".jpg", "_2.jpg"), product.image.replace(".jpg", "_3.jpg")],
  };
}

async function mockGetCategories() {
  const categories = getUniqueCategories();
  return categories;
}

route.add("/", async ({ query }) => {
  const productsData = await mockGetProducts(query || {});
  const categories = await mockGetCategories();

  const stateToSetup = {
    products: productsData.products,
    categories,
    totalCount: productsData.pagination.total,
    currentProduct: null,
    relatedProducts: [],
    loading: false,
    error: null,
    status: "done",
  };
  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: stateToSetup,
  });

  return {
    status: 200,
    head: "<title>쇼핑몰 - 홈</title>",
    html: HomePage(),
    initialData: stateToSetup,
  };
});

route.add("/product/:id", async ({ params }) => {
  const product = await mockGetProduct(params.id);
  if (!product) {
    return { status: 404, head: "<title>404</title>", html: NotFoundPage(), initialData: null };
  }

  const relatedProducts = product.category2
    ? (await mockGetProducts({ category2: product.category2, limit: 20, page: 1 })).products.filter(
        (p) => p.productId !== params.id,
      )
    : [];

  const stateToSetup = {
    products: [],
    categories: {},
    totalCount: 0,
    currentProduct: product,
    relatedProducts,
    loading: false,
    error: null,
    status: "done",
  };

  productStore.dispatch({
    type: PRODUCT_ACTIONS.SETUP,
    payload: stateToSetup,
  });

  return {
    status: 200,
    head: `<title>${product.title} - 쇼핑몰</title>`,
    html: ProductDetailPage(),
    initialData: stateToSetup,
  };
});

export const render = async (url, query) => {
  productStore.dispatch({ type: "RESET" });
  cartStore.dispatch({ type: "RESET" });
  uiStore.dispatch({ type: "RESET" });

  const matchedRoute = route.find(url);

  if (!matchedRoute)
    return {
      status: 404,
      head: "",
      html: NotFoundPage(),
      initialData: null,
    };

  return matchedRoute.handler({ params: matchedRoute.params, query });
};
