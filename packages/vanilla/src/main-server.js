import { HomePage } from "./pages/HomePage.js";

export const render = async (url, query) => {
  console.log({ url, query });
  return {
    head: "<title>쇼핑몰</title>",
    html: HomePage({ url, query }),
  };
};
