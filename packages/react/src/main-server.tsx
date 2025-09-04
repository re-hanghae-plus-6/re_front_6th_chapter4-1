import { renderToString } from "react-dom/server";
import { App } from "./App";
import { loadHomePageData, loadProductDetailData } from "./ssr-data";
import type { HomePageData, ProductDetailData } from "./ssr-data";

export const render = async (url: string, query: Record<string, string>) => {
  try {
    // URL에 따라 데이터 로딩
    let initialData: HomePageData | ProductDetailData | Record<string, unknown> = {};
    let title = "쇼핑몰";

    if (url === "/") {
      // 홈페이지 데이터 로딩
      const homeData = await loadHomePageData(url, query);
      initialData = {
        products: homeData.products,
        categories: homeData.categories,
        totalCount: homeData.totalCount,
        url,
        query,
      };
      title = "쇼핑몰 - 홈";
    } else if (url.startsWith("/product/")) {
      // 상품 상세 페이지 데이터 로딩
      const productId = url.split("/product/")[1]?.split("/")[0];
      if (productId) {
        const productData = await loadProductDetailData(productId);
        if (productData) {
          initialData = {
            product: productData.product,
            relatedProducts: productData.relatedProducts,
            url,
            query,
          };
          title = `${productData.product.title} - 쇼핑몰`;
        }
      }
    }

    // React 컴포넌트를 HTML 문자열로 렌더링
    const html = renderToString(<App />);

    return {
      html,
      head: `<title>${title}</title>`,
      initialData,
    };
  } catch (error) {
    console.error("SSR Error:", error);
    return {
      html: "<div>Error occurred</div>",
      head: "<title>Error</title>",
      initialData: {},
    };
  }
};
