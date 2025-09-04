import { PageWrapper } from "./pages/PageWrapper.js";
import { SearchBar } from "./components/SearchBar.js";

export const render = async (url, query) => {
  console.log({ url, query });
  return {
    head: "",
    html: PageWrapper({
      headerLeft: `
      <h1 class="text-xl font-bold text-gray-900">
        <a href="/" data-link>쇼핑몰</a>
      </h1>
    `.trim(),
      children: `
      <!-- 검색 및 필터 -->
      ${SearchBar({ searchQuery: "", limit: 20, sort: "price_asc", category: {}, categories: [] })}
      
      <!-- 상품 목록 -->
      <div class="mb-6">
       안녕하세요
        </div>
      `.trim(),
    }),
  };
};
