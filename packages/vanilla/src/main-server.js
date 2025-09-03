import { HomePage } from "./pages";

export const render = async (url, query) => {
  console.log({ url, query });
  return {
    head: "<title>test</title>",
    html: HomePage(),
  };
};
