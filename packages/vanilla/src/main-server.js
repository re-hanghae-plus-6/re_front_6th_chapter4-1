export const render = async (url, query) => {
  console.log({ url, query });
  return {
    html: '<div id="app">Hello SSR</div>',
    head: "<title>SSR Test</title>",
    initialData: {},
  };
};
