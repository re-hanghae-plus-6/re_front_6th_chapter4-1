import { App } from "./App";
import { router } from "./router/router";
import { renderToString } from "react-dom/server";

export const render = async (url: string, query: Record<string, string>) => {
  console.log({ url, query });

  router.push(url);
  router.query = query;

  return {
    head: "Hello, world!",
    html: renderToString(<App />),
    initialData: {},
  };
};
