import { HomePage, HomePageSSR } from "./pages/HomePage.js";
import { ProductDetailPageSSR, ProductDetailPage } from "./pages/ProductDetailPage.js";

/**
 * @param {string} url
 * @param {Record<string,string>} query
 * @param {any} _initialData
 * @param {{ doSSR?: boolean }} ctx  // ← 서버가 넘겨주는 컨텍스트
 */
export const render = async (url, query, _initialData, ctx = {}) => {
  const doSSR = ctx.doSSR ?? true; // 기본값: SSR

  if (url.split("/")?.[0] === "product") {
    const title = _initialData.currentProduct.title;

    return {
      head: `<title>${title ? `${title} - 쇼핑몰` : "쇼핑몰 - 홈"}</title>`,
      html: doSSR ? ProductDetailPageSSR({ initialData: _initialData }) : ProductDetailPage({ url, query }),
    };
  }

  return {
    head: "<title>쇼핑몰 - 홈</title>",
    html: doSSR ? HomePageSSR({ url, query, initialData: _initialData }) : HomePage({ url, query }),
  };
};
