import { PageWrapper } from "./pages/PageWrapper";

export const render = async (url, query) => {
  console.log({ url, query });
  return {
    head: "<title>쇼핑몰</title>",
    html: PageWrapper({
      headerLeft: /*Html*/ `   
       <h1 className="text-xl font-bold text-gray-900">
        <a href="/" data-link="/">
          쇼핑몰
        </a>
      </h1>`,
      children: /*Html*/ `<div>안녕하세요</div>`,
    }),
  };
};
