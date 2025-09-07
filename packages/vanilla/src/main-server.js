export const render = async (url, query) => {
  console.log({ url, query });

  return {
    head: `<title>쇼핑몰</title>`,
    html: "",
    initialData: "",
  };
};
