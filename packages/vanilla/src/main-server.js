import { renderPage } from "./lib/serverRouter.js";

export const render = async (url, query) => {
  return await renderPage(url, query);
};
