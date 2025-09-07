import { router } from "./router";

export const render = async (pathname, query) => {
  console.log({ pathname, query });
  router.start(pathname, query);
  const data = (await router.target?.ssr({ pathname, query })) ?? {};
  return {
    head: "",
    html: router.target({ pathname, query, data }),
    __INITIAL_DATA__: data,
  };
};
