import { HomePage } from "./pages";
import { getProducts, getCategories } from "./api/productApi";

export const render = async (url, query) => {
  console.log({ url, query });

  const [
    {
      products,
      pagination: { total },
    },
    categories,
  ] = await Promise.all([getProducts(query), getCategories()]);

  const productInfo = {
    products,
    categories,
    totalCount: total,
    loading: false,
    status: "done",
  };
  return {
    head: "<title>Vanilla Javascript SSR</title>",
    html: HomePage({ query, productInfo }),
  };
};
