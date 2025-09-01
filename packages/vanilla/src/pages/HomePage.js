import { ProductList, SearchBar } from "../components";
import { productStore } from "../stores";
import { router, withLifecycle } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";
import { PageWrapper } from "./PageWrapper.js";

export const HomePage = withLifecycle(
  {
    onMount: () => {
      loadProductsAndCategories();
    },
    watches: [
      () => {
        const { search, limit, sort, category1, category2 } = router.query;
        return [search, limit, sort, category1, category2];
      },
      () => loadProducts(true),
    ],
  },
  () => {
    const productState = productStore.getState();
    const { search: searchQuery, limit, sort, category1, category2 } = router.query;
    const { products, loading, error, totalCount, categories } = productState;
    const category = { category1, category2 };
    const hasMore = products.length < totalCount;

    return PageWrapper({
      headerLeft: `
        <h1 class="text-xl font-bold text-gray-900">
          <a href="/" data-link>쇼핑몰</a>
        </h1>
      `.trim(),
      children: `
        <!-- 검색 및 필터 -->
        ${SearchBar({ searchQuery, limit, sort, category, categories })}
        
        <!-- 상품 목록 -->
        <div class="mb-6">
          ${ProductList({
            products,
            loading,
            error,
            totalCount,
            hasMore,
          })}
        </div>
      `.trim(),
    });
  },
);

export const HomePageSSR = ({ url, query, initialData = {} }) => {
  const urlParams = new URLSearchParams(url.split("?")[1] || "");
  console.log(query);

  const search = urlParams.get("search") || "";
  const products = initialData.products ?? [];
  const categories = initialData.categories ?? {};
  const totalCount = initialData.totalCount ?? products.length;
  const category = { category1: urlParams.get("category1") ?? "", category2: urlParams.get("category2") ?? "" };

  return PageWrapper({
    headerLeft: `
      <h1 class="text-xl font-bold text-gray-900">
        <a href="/" data-link>쇼핑몰</a>
      </h1> 
    `.trim(),
    children: `
      <!-- 검색 및 필터 -->
      ${SearchBar({ searchQuery: search, limit: urlParams.get("limit") ?? "", sort: urlParams.get("sort") ?? "", category, categories })}
      
      <!-- 상품 목록 -->
      <div class="mb-6">
        <div class="mb-4 text-sm text-gray-600">
          총 <span class="font-medium text-gray-900">3개</span>의 상품
        </div>
        <div>          
        ${ProductList({
          products: products,
          loading: false,
          error: null,
          totalCount,
          hasMore: false,
        })}</div>
      </div>
    `.trim(),
  });
};
