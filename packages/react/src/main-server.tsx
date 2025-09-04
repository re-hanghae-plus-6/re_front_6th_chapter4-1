// main-server.js 수정된 버전

import { renderToString } from "react-dom/server";
import { Router } from "@hanghae-plus/lib";
import type { FunctionComponent } from "react";
import { BASE_URL } from "./constants";
import { getProducts, getProduct, getCategories } from "./mocks/ssr-data";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { PRODUCT_ACTIONS, ProductProvider, productStore } from "./entities";
import { App } from "./App";

export const render = async (url: string, query: Record<string, string>) => {
  console.log("SSR render 시작:", { url, query });

  const serverRouter = new Router<FunctionComponent>(BASE_URL);

  try {
    // 라우트 등록
    serverRouter.addRoute("/", HomePage);
    serverRouter.addRoute("/product/:id", ProductDetailPage);
    serverRouter.addRoute("*", NotFoundPage);
  } catch (error) {
    console.error("라우터 설정 오류:", error);
  }

  const splitUrl = url.split("/").filter((segment) => segment !== "");

  const initialData = {
    products: [],
    categories: {},
    totalCount: 0,
    loading: false,
    error: null,
    currentProduct: null,
    relatedProducts: [],
    filters: {},
  };

  try {
    if (splitUrl?.[0] === "product") {
      // 상품 상세 페이지
      const productId = splitUrl[1];
      console.log("상품 상세 페이지 데이터 로딩:", productId);

      try {
        const product = await getProduct(productId);
        console.log("상품 로딩 성공:", product.title);

        initialData.currentProduct = product;

        // 관련 상품 로딩
        if (product.category2) {
          try {
            const relatedData = await getProducts({
              category2: product.category2,
              limit: "20",
            });
            initialData.relatedProducts = relatedData.products.filter((p) => p.productId !== productId);
            console.log("관련 상품 로딩 성공:", initialData.relatedProducts.length, "개");
          } catch (relatedError) {
            console.error("관련 상품 로딩 실패:", relatedError);
            initialData.relatedProducts = [];
          }
        }

        const categoriesData = await getCategories();
        initialData.categories = categoriesData;
      } catch (productError) {
        console.error("상품 로딩 실패:", productError);
      }
    } else {
      // 홈페이지
      console.log("홈페이지 데이터 로딩");
      const [productsData, categoriesData] = await Promise.all([getProducts(query), getCategories()]);

      initialData.products = productsData.products;
      initialData.categories = categoriesData;
      initialData.totalCount = productsData.pagination.total;
      initialData.filters =
        Object.keys(query).length > 0
          ? {
              search: query.search || "",
              limit: query.limit || "",
              sort: query.sort || "",
              category1: query.category1 || "",
              category2: query.category2 || "",
            }
          : { limit: "20", sort: "price_asc" };
    }

    console.log("초기 데이터 준비 완료:", {
      productsCount: initialData.products.length,
      categoriesCount: Object.keys(initialData.categories).length,
      totalCount: initialData.totalCount,
      currentProduct: initialData.currentProduct,
      relatedCount: initialData.relatedProducts.length,
    });
  } catch (error) {
    console.error("데이터 로딩 오류:", error);
  }

  // React 컴포넌트를 HTML로 렌더링
  let html = "";
  try {
    console.log("React 컴포넌트 렌더링 시작");

    // 스토어 초기화
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SET_INITIAL_DATA,
      payload: initialData,
    });

    // 전체 렌더링
    html = renderToString(
      <ProductProvider initialData={initialData}>
        <App url={url} />
      </ProductProvider>,
    );

    console.log("전체 렌더링 완료, HTML 길이:", html.length);

    if (html.length === 0) {
      console.error("⚠️ 렌더링된 HTML이 비어있습니다!");
      // 폴백 HTML
      html = `<div id="root"><!-- SSR 실패, 클라이언트에서 렌더링됩니다 --></div>`;
    }
  } catch (renderError) {
    console.error("React 렌더링 오류:", renderError);
    html = `<div id="root"><!-- 렌더링 오류: ${renderError} --></div>`;
  }

  const head = `<title>${initialData.currentProduct ? `${initialData.currentProduct?.title} - 쇼핑몰` : "쇼핑몰 - 홈"}</title>`;

  console.log("SSR render 완료");

  return {
    html,
    head,
    initialData,
  };
};

export const debugSSR = () => {
  console.log("=== SSR 디버깅 정보 ===");
  console.log("renderToString 함수:", typeof renderToString);
  console.log("App 컴포넌트:", typeof App);
  console.log("ProductProvider:", typeof ProductProvider);
  console.log("BASE_URL:", BASE_URL);
};
