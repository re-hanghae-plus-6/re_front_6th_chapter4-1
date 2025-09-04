import { App } from "./App";
import { router } from "./router/router";
import { renderToString } from "react-dom/server";
import { productStore } from "./entities";

export const render = async (url: string, query: Record<string, string>) => {
  console.log({ url, query });

  router.push(url);
  router.query = query;

  const { products, categories, totalCount } = productStore.getState();

  const initialData = {
    products,
    categories,
    totalCount,
  };
  return {
    head: "<title>쇼핑몰 홈</title>",
    html: renderToString(<App />),
    initialData,
  };
};
