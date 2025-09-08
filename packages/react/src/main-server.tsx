import { createElement } from "react";
import { renderToString } from "react-dom/server";
import { HomePage, ProductDetailPage, NotFoundPage } from "./pages";
import { productStore } from "./entities/products/productStore";
import type { Product, Categories } from "./entities/products/types";
import items from "./mocks/items.json" with { type: "json" };

// ===== 추가 타입 정의 =====
interface ProductData {
  products: Product[];
  categories: Categories;
  totalCount: number;
}

interface ProductDetailData {
  currentProduct: Product;
  relatedProducts: Product[];
}

interface RenderResult {
  initialData: ProductData | ProductDetailData | Record<string, never>;
  html: string;
  head: string;
}

// ===== 데이터 로딩 유틸리티 함수들 =====
function getUniqueCategories(): Categories {
  const categories: Categories = {};

  items.forEach((item: Product) => {
    const cat1 = item.category1;
    const cat2 = item.category2;

    if (!categories[cat1]) categories[cat1] = {};
    if (cat2 && !categories[cat1][cat2]) categories[cat1][cat2] = {};
  });

  return categories;
}

function getProductById(id: string): Product | undefined {
  return items.find((item: Product) => item.productId === id);
}

function getRelatedProducts(category2: string, productId: string): Product[] {
  return items.filter((p: Product) => p.category2 === category2 && p.productId !== productId).slice(0, 4);
}

// 상품 검색 및 필터링 함수
function filterProducts(products: Product[], query: Record<string, string>): Product[] {
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

export const render = async (
  url: string,
  query: Record<string, string>,
): Promise<RenderResult & { __INITIAL_DATA__?: unknown }> => {
  try {
    // URL 정규화 - 슬래시 정리
    let normalizedUrl = url === "" ? "/" : url;
    // 앞에 슬래시가 없으면 추가
    if (!normalizedUrl.startsWith("/")) {
      normalizedUrl = "/" + normalizedUrl;
    }
    // 끝에 슬래시가 있으면 제거 (홈페이지 제외)
    if (normalizedUrl.endsWith("/") && normalizedUrl !== "/") {
      normalizedUrl = normalizedUrl.slice(0, -1);
    }

    const pathOnly = normalizedUrl.split("?")[0];
    console.log("🔍 URL 처리:", { originalUrl: url, normalizedUrl, pathOnly });
    if (pathOnly === "/" || pathOnly === "") {
      // 홈페이지
      const categories = getUniqueCategories();

      // 쿼리 파라미터 처리 (URL 디코딩 포함)
      const processedQuery = { ...query };
      if (processedQuery.search) {
        processedQuery.search = decodeURIComponent(processedQuery.search);
      }
      if (processedQuery.category1) {
        processedQuery.category1 = decodeURIComponent(processedQuery.category1);
      }
      if (processedQuery.category2) {
        processedQuery.category2 = decodeURIComponent(processedQuery.category2);
      }

      const filteredProducts = filterProducts(items, processedQuery);
      const limit = parseInt(processedQuery.limit || "20", 10);
      const paginatedProducts = filteredProducts.slice(0, limit);

      // 서버 상태 초기화
      const productData: ProductData = {
        products: paginatedProducts,
        categories,
        totalCount: filteredProducts.length,
      };

      // 스토어에 초기 데이터 설정
      productStore.dispatch({
        type: "products/setup",
        payload: productData,
      });

      console.log("✅ React SSR 완료:", normalizedUrl);
      const html = renderToString(
        createElement(HomePage, {
          searchQuery: processedQuery.search,
          limit: processedQuery.limit,
          sort: processedQuery.sort,
          category1: processedQuery.category1,
          category2: processedQuery.category2,
        }),
      );
      console.log("🔍 홈페이지 렌더링된 HTML 길이:", html.length);
      return {
        html,
        head: "<title>쇼핑몰 - 홈</title>",
        initialData: productData,
        __INITIAL_DATA__: productData,
      };
    } else if (pathOnly.startsWith("/product/")) {
      // 상품 상세 페이지 - 경로에서 productId 추출
      const pathSegments = pathOnly.split("/").filter((segment) => segment);
      const productId = pathSegments[1]; // /product/85067212996/ -> 85067212996
      console.log("🔍 상품 상세 페이지 SSR:", { pathOnly, pathSegments, productId, url, query });
      const product = getProductById(productId);
      console.log("🔍 상품 찾기 결과:", { productId, found: !!product, productTitle: product?.title });

      if (!product) {
        console.log("✅ React SSR 완료:", normalizedUrl);
        return {
          html: renderToString(createElement(NotFoundPage)),
          head: "<title>페이지 없음 - 쇼핑몰</title>",
          initialData: {},
          __INITIAL_DATA__: {},
        };
      }

      const relatedProducts = getRelatedProducts(product.category2, product.productId);

      // 서버 상태 초기화
      const productDetailData: ProductDetailData = {
        currentProduct: product,
        relatedProducts,
      };

      productStore.dispatch({
        type: "products/setup",
        payload: productDetailData,
      });

      console.log("✅ React SSR 완료:", normalizedUrl);
      const html = renderToString(createElement(ProductDetailPage));
      console.log("🔍 렌더링된 HTML 길이:", html.length);
      return {
        html,
        head: `<title>${product.title} - 쇼핑몰</title>`,
        initialData: productDetailData,
        __INITIAL_DATA__: productDetailData,
      };
    } else {
      // 404 페이지
      console.log("✅ React SSR 완료:", normalizedUrl);
      return {
        html: renderToString(createElement(NotFoundPage)),
        head: "<title>페이지 없음 - 쇼핑몰</title>",
        initialData: {},
        __INITIAL_DATA__: {},
      };
    }
  } catch (error) {
    console.error("❌ React SSR 에러:", error);
    console.error("📍 에러 스택:", error instanceof Error ? error.stack : "No stack trace");
    console.error("📍 URL:", url);
    console.error("📍 Query:", query);
    // 에러 발생 시 기본 에러 페이지 반환
    return {
      head: "<title>에러 - 쇼핑몰</title>",
      html: "<div>서버 오류가 발생했습니다.</div>",
      initialData: {},
      __INITIAL_DATA__: { error: error instanceof Error ? error.message : String(error) },
    };
  }
};
