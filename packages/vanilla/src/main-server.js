import { HomePage, HomePageSSR } from "./pages/HomePage.js";

/**
 * @param {string} url
 * @param {Record<string,string>} query
 * @param {any} _initialData
 * @param {{ doSSR?: boolean }} ctx  // ← 서버가 넘겨주는 컨텍스트
 */
export const render = async (url, query, _initialData, ctx = {}) => {
  const doSSR = ctx.doSSR ?? true; // 기본값: SSR

  return {
    head: "<title>쇼핑몰</title>",
    html: doSSR ? HomePageSSR({ url, query, initialData: _initialData }) : HomePage({ url, query }),
  };
};
