import { SearchBar } from "./components";
import { PageWrapper } from "./pages";

/**
 * @param {string} url
 * @param {Record<string, string | string[] | undefined>} query
 */
export const render = async (url, query) => {
  console.log({ url, query });

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
  };
};
