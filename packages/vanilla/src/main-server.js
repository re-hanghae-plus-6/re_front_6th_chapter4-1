export const render = async (url, query) => {
  console.log({ url, query });
  return {
    html: `<h1>Page not found</h1>`,
    head: `<title>404 Not Found</title>`,
    initialData: {},
  };
};
