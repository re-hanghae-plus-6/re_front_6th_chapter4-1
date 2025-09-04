/* eslint-disable react-refresh/only-export-components */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createElement } from "react";
import { renderToString } from "react-dom/server";
import items from "./mocks/items.json" with { type: "json" };

// 카테고리 추출 함수
function getUniqueCategories() {
  const categories: Record<string, Record<string, any>> = {};

  items.forEach((item) => {
    const cat1 = item.category1;
    const cat2 = item.category2;

    if (!categories[cat1]) categories[cat1] = {};
    if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {};
  });

  return categories;
}

// 상품 검색 및 필터링 함수
function filterProducts(products: any[], query: Record<string, string>) {
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

  // 정렬 - 기본값을 price_asc로 변경
  const sort = query.sort || "price_asc";
  switch (sort) {
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

  return filtered;
}

// SSR 전용 최소 컴포넌트들
const SSRHomePage = ({
  products,
  totalCount,
  categories,
  query,
}: {
  products: any[];
  totalCount: number;
  categories: any;
  query: Record<string, string>;
}) => {
  const searchValue = query.search || "";
  const limitValue = query.limit || "20";
  const sortValue = query.sort || "price_asc"; // 기본값을 price_asc로 변경
  const category1 = query.category1 || "";
  const category2 = query.category2 || "";

  return createElement(
    "div",
    { className: "min-h-screen bg-gray-50" },
    createElement(
      "header",
      { className: "bg-white shadow-sm sticky top-0 z-40" },
      createElement(
        "div",
        { className: "max-w-md mx-auto px-4 py-4" },
        createElement(
          "div",
          { className: "flex items-center justify-between" },
          createElement("h1", { className: "text-xl font-bold text-gray-900" }, "쇼핑몰"),
          createElement(
            "button",
            {
              id: "cart-icon-btn",
              className: "relative p-2 text-gray-700 hover:text-gray-900 transition-colors",
            },
            "장바구니",
          ),
        ),
      ),
    ),
    createElement(
      "main",
      { className: "max-w-md mx-auto px-4 py-4" },
      // SearchBar 컴포넌트 내용
      createElement(
        "div",
        { className: "mb-6" },
        // 검색 입력
        createElement(
          "div",
          { className: "mb-4" },
          createElement("input", {
            id: "search-input",
            type: "text",
            placeholder: "상품 검색...",
            defaultValue: searchValue,
            className:
              "w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 focus:border-blue-500",
          }),
        ),

        // 카테고리 섹션
        createElement(
          "div",
          { className: "mb-4" },
          createElement("div", { className: "text-sm text-gray-600 mb-2" }, "카테고리 로딩 중..."),
          createElement(
            "div",
            { className: "flex flex-wrap gap-2" },
            Object.keys(categories).map((category) =>
              createElement(
                "button",
                {
                  key: category,
                  "data-category1": category,
                  className: `px-3 py-1 text-sm rounded-full border ${
                    category1 === category
                      ? "bg-blue-100 text-blue-800 border-blue-300"
                      : "bg-gray-100 text-gray-700 border-gray-300"
                  }`,
                },
                category,
              ),
            ),
          ),
        ),

        // 브레드크럼 (카테고리가 선택된 경우)
        (category1 || category2) &&
          createElement(
            "div",
            { className: "mb-4" },
            createElement(
              "div",
              { className: "text-sm text-gray-600" },
              "카테고리: ",
              category1 &&
                createElement(
                  "button",
                  {
                    "data-breadcrumb": "category1",
                    "data-category1": category1,
                    className: "text-blue-600 hover:text-blue-800",
                  },
                  category1,
                ),
              category2 && createElement("span", null, " > "),
              category2 && createElement("span", { className: "text-gray-900" }, category2),
            ),
          ),

        // 필터 옵션들
        createElement(
          "div",
          { className: "flex gap-2 items-center justify-between" },
          // 페이지당 상품 수
          createElement(
            "div",
            { className: "flex items-center gap-2" },
            createElement("label", { htmlFor: "limit-select", className: "text-sm text-gray-600" }, "개수:"),
            createElement(
              "select",
              {
                id: "limit-select",
                defaultValue: limitValue,
                className:
                  "text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500",
              },
              createElement("option", { value: "10" }, "10개"),
              createElement("option", { value: "20" }, "20개"),
              createElement("option", { value: "50" }, "50개"),
              createElement("option", { value: "100" }, "100개"),
            ),
          ),

          // 정렬
          createElement(
            "div",
            { className: "flex items-center gap-2" },
            createElement("label", { htmlFor: "sort-select", className: "text-sm text-gray-600" }, "정렬:"),
            createElement(
              "select",
              {
                id: "sort-select",
                defaultValue: sortValue,
                className:
                  "text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-blue-500 focus:border-blue-500",
              },
              createElement("option", { value: "price_asc" }, "가격 낮은순"),
              createElement("option", { value: "price_desc" }, "가격 높은순"),
              createElement("option", { value: "name_asc" }, "이름순"),
              createElement("option", { value: "name_desc" }, "이름 역순"),
            ),
          ),
        ),
      ),

      // 상품 개수 정보
      createElement(
        "div",
        { className: "mb-4 text-sm text-gray-600" },
        "총 ",
        createElement("span", { className: "font-medium text-gray-900" }, `${totalCount.toLocaleString()}개`),
        "의 상품",
      ),

      // 상품 그리드
      createElement(
        "div",
        { className: "grid grid-cols-2 gap-4 mb-6", id: "products-grid" },
        products.slice(0, 20).map((product) =>
          createElement(
            "div",
            {
              key: product.productId,
              className: "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden product-card",
            },
            createElement(
              "div",
              { className: "aspect-square bg-gray-100 overflow-hidden cursor-pointer product-image" },
              createElement("img", {
                src: product.image,
                alt: product.title,
                className: "w-full h-full object-cover hover:scale-105 transition-transform duration-200",
                loading: "lazy",
              }),
            ),
            createElement(
              "div",
              { className: "p-3" },
              createElement(
                "div",
                { className: "cursor-pointer product-info mb-3" },
                createElement(
                  "h3",
                  { className: "text-sm font-medium text-gray-900 line-clamp-2 mb-1" },
                  product.title,
                ),
                createElement("p", { className: "text-xs text-gray-500 mb-2" }, product.brand),
                createElement(
                  "p",
                  { className: "text-lg font-bold text-gray-900" },
                  `${Number(product.lprice).toLocaleString()}원`,
                ),
              ),
              createElement(
                "button",
                {
                  className:
                    "w-full bg-blue-600 text-white text-sm py-2 px-3 rounded-md hover:bg-blue-700 transition-colors add-to-cart-btn",
                  "data-product-id": product.productId,
                },
                "장바구니 담기",
              ),
            ),
          ),
        ),
      ),
    ),
  );
};

const SSRProductDetailPage = ({ product, relatedProducts }: { product: any; relatedProducts: any[] }) => {
  return createElement(
    "div",
    { className: "min-h-screen bg-gray-50" },
    createElement(
      "header",
      { className: "bg-white shadow-sm sticky top-0 z-40" },
      createElement(
        "div",
        { className: "max-w-md mx-auto px-4 py-4" },
        createElement(
          "div",
          { className: "flex items-center justify-between" },
          createElement("h1", { className: "text-xl font-bold text-gray-900" }, "쇼핑몰"),
          createElement(
            "button",
            {
              id: "cart-icon-btn",
              className: "relative p-2 text-gray-700 hover:text-gray-900 transition-colors",
            },
            "장바구니",
          ),
        ),
      ),
    ),
    createElement(
      "main",
      { className: "max-w-md mx-auto px-4 py-4" },
      createElement(
        "div",
        { className: "mb-6" },
        createElement("h1", { className: "text-2xl font-bold text-gray-900 mb-4" }, product.title),
        createElement("p", { className: "text-lg text-gray-600 mb-4" }, "상품 상세"),
        createElement(
          "div",
          { className: "aspect-square bg-gray-100 rounded-lg overflow-hidden mb-4" },
          createElement("img", {
            src: product.image,
            alt: product.title,
            className: "w-full h-full object-cover",
          }),
        ),
        createElement(
          "div",
          { className: "mb-4" },
          createElement(
            "p",
            { className: "text-3xl font-bold text-gray-900 mb-2" },
            `${Number(product.lprice).toLocaleString()}원`,
          ),
          createElement("p", { className: "text-sm text-gray-500" }, product.brand),
        ),
        createElement(
          "div",
          { className: "flex items-center gap-4 mb-4" },
          createElement(
            "button",
            { id: "quantity-decrease", className: "w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center" },
            "-",
          ),
          createElement("input", {
            id: "quantity-input",
            type: "number",
            defaultValue: "1",
            min: "1",
            className: "w-16 text-center border border-gray-300 rounded",
          }),
          createElement(
            "button",
            { id: "quantity-increase", className: "w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center" },
            "+",
          ),
        ),
        createElement(
          "button",
          {
            id: "add-to-cart-btn",
            className: "w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 transition-colors",
          },
          "장바구니 담기",
        ),
      ),
      createElement(
        "div",
        { className: "mb-6" },
        createElement("h2", { className: "text-xl font-bold text-gray-900 mb-4" }, "관련 상품"),
        createElement(
          "div",
          { className: "grid grid-cols-2 gap-4" },
          relatedProducts.slice(0, 4).map((relatedProduct) =>
            createElement(
              "div",
              {
                key: relatedProduct.productId,
                className:
                  "bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden related-product-card cursor-pointer",
              },
              createElement(
                "div",
                { className: "aspect-square bg-gray-100 overflow-hidden" },
                createElement("img", {
                  src: relatedProduct.image,
                  alt: relatedProduct.title,
                  className: "w-full h-full object-cover",
                }),
              ),
              createElement(
                "div",
                { className: "p-3" },
                createElement(
                  "h3",
                  { className: "text-sm font-medium text-gray-900 line-clamp-2 mb-1" },
                  relatedProduct.title,
                ),
                createElement(
                  "p",
                  { className: "text-lg font-bold text-gray-900" },
                  `${Number(relatedProduct.lprice).toLocaleString()}원`,
                ),
              ),
            ),
          ),
        ),
      ),
    ),
  );
};

const SSRNotFoundPage = () => {
  return createElement(
    "div",
    { className: "min-h-screen bg-gray-50 flex items-center justify-center" },
    createElement(
      "div",
      { className: "text-center" },
      createElement("h1", { className: "text-4xl font-bold text-gray-900 mb-4" }, "404"),
      createElement("p", { className: "text-gray-600 mb-4" }, "페이지를 찾을 수 없습니다."),
      createElement(
        "a",
        {
          href: "/",
          className: "text-blue-600 hover:text-blue-800",
        },
        "홈으로",
      ),
    ),
  );
};

export const render = async (url: string, query: Record<string, string>) => {
  console.log({ url, query });

  try {
    // 초기 데이터 로딩
    let initialData = null;
    let PageComponent = null;

    if (url === "/" || url === "") {
      // 홈페이지의 경우 상품 데이터 로딩
      try {
        const categories = getUniqueCategories();
        const filteredProducts = filterProducts(items, {
          search: query.search || "",
          category1: query.category1 || "",
          category2: query.category2 || "",
          sort: query.sort || "price_asc", // 기본값을 price_asc로 변경
        });

        const limit = Number(query.limit) || 20;
        const current = Number(query.current) || 1;
        const startIndex = (current - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

        initialData = {
          products: paginatedProducts,
          categories: categories,
          totalCount: filteredProducts.length,
        };

        PageComponent = SSRHomePage;
      } catch (error) {
        console.error("상품 데이터 로딩 실패:", error);
        initialData = {
          products: [],
          categories: {},
          totalCount: 0,
        };
        PageComponent = SSRHomePage;
      }
    } else if (url.startsWith("/product/")) {
      // 상품 상세 페이지의 경우
      const productId = url.split("/")[2];
      if (productId) {
        try {
          const product = items.find((item) => item.productId === productId);

          if (!product) {
            PageComponent = SSRNotFoundPage;
            initialData = null;
          } else {
            // 관련 상품 로딩 (같은 category2 기준)
            let relatedProducts: any[] = [];
            if (product.category2) {
              relatedProducts = items
                .filter((p) => p.category2 === product.category2 && p.productId !== productId)
                .slice(0, 4);
            }

            initialData = {
              product,
              relatedProducts,
            };

            PageComponent = SSRProductDetailPage;
          }
        } catch (error) {
          console.error("상품 상세 데이터 로딩 실패:", error);
          initialData = null;
          PageComponent = SSRNotFoundPage;
        }
      }
    } else {
      PageComponent = SSRNotFoundPage;
    }
    // React 컴포넌트를 HTML로 렌더링
    const appHtml = PageComponent
      ? renderToString(createElement(PageComponent as any, { ...initialData, query }))
      : "<div>페이지를 찾을 수 없습니다.</div>";

    // 메타태그 생성
    let head = "";
    if (url === "/" || url === "") {
      head = `<title>쇼핑몰 - 홈</title>`;
    } else if (url.startsWith("/product/") && initialData?.product) {
      const product = initialData.product;
      head = `<title>${product.title} - 쇼핑몰</title>`;
    } else {
      head = `<title>쇼핑몰</title>`;
    }

    return {
      html: appHtml,
      head,
      __INITIAL_DATA__: initialData,
    };
  } catch (error) {
    console.error("SSR 렌더링 오류:", error);
    return {
      html: "<div>서버 오류가 발생했습니다.</div>",
      head: "<title>오류 - 쇼핑몰</title>",
      __INITIAL_DATA__: null,
    };
  }
};
