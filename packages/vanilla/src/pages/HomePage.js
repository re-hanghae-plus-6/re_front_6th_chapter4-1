import { ProductList, SearchBar } from "../components";
import { routerInstance, withLifecycle, withUniversal } from "../router";
import { loadProducts, loadProductsAndCategories } from "../services";
import { productStore } from "../stores";
import { PageWrapper } from "./PageWrapper";

const homePageLifecycle = {
  onMount: loadProductsAndCategories,
  watches: [
    () => {
      const { search, limit, sort, category1, category2 } = routerInstance.query;
      return [search, limit, sort, category1, category2];
    },
    () => loadProducts(true),
  ],
};

function HomePageComponent({ query = {}, data }) {
  const productState = data ? data : productStore.getState();
  const { search: searchQuery, limit, sort, category1, category2 } = query;
  const { products, loading, error, totalCount, categories } = productState;

  const category = { category1, category2 };
  const hasMore = products.length < totalCount;

  return PageWrapper({
    headerLeft: /* HTML */ `
      <h1 class="text-xl font-bold text-gray-900">
        <a href="/" data-link>쇼핑몰</a>
      </h1>
    `.trim(),
    children: /* HTML */ `
      <!-- 검색 및 필터 -->
      ${SearchBar({ searchQuery, limit, sort, category, categories })}
      
      <!-- 상품 목록 -->
      <div class="mb-6">
        ${ProductList({ products, loading, error, totalCount, hasMore })}
      </div>
    `.trim(),
  });
}

export const HomePage = withUniversal(withLifecycle(homePageLifecycle, HomePageComponent));
