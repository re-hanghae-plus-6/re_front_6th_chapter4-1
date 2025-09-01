import { SearchBar } from "./components";
import items from "./mocks/items.json" with { type: "json" };
import { PageWrapper } from "./pages";

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

/**
 * @param {string} url
 * @param {Record<string, string | string[] | undefined>} query
 */
export const render = async (url, query) => {
  const data = filterProducts(items, query);

  return {
    head: /* HTML */ `<title>쇼핑몰</title>`,
    html: PageWrapper({
      headerLeft: /* HTML */ `
        <h1 class="text-xl font-bold text-gray-900">
          <a href="/" data-link>쇼핑몰</a>
        </h1>
      `.trim(),
      children: /* HTML */ `
        <!-- 검색 및 필터 -->
        ${SearchBar({
          searchQuery: "",
          limit: 20,
          sort: "price_asc",
          category: {},
          categories: [],
        })}
            
        <!-- 상품 목록 -->
        <div class="mb-6">
          안녕하세요.
        </div>
      `.trim(),
    }),
    data,
  };
};
