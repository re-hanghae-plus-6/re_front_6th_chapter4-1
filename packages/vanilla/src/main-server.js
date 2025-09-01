import { HomePage } from "./pages/index.js";

import { getCategories, getProducts } from "./api/productApi.js";

export const render = async (url, query) => {
  const [
    {
      products,
      pagination: { total },
    },
    categories,
  ] = await Promise.all([getProducts(query), getCategories()]);

  return {
    head: "<title> ssr </title>",
    html: HomePage(url, query, {
      products,
      categories,
      totalCount: total,
      loading: false,
      status: "done",
    }),
  };
};
