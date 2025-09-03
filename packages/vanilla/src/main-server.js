import { HomePage } from "./pages/HomePage";

export const render = async (url, query) => {
  console.log({ url, query });
  return {
    head: `<title>Vanilla SSR</title>`,
    html: HomePage(),
  };
};
