import { HomePage } from "./pages/index.js";

export const render = async (url, query) => {
  console.log({ url, query });
  return HomePage();
};
