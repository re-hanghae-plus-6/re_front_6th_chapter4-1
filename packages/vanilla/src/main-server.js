export const render = async (url, query) => {
  console.log({ url, query });
  return {
    head: "<title>test</title>",
    html: "<div>test</div>",
  };
};
