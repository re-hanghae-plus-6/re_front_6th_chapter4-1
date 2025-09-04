import { router } from "./router";
import { setupRouter } from "./setupRouter.js";

// 라우터 설정
setupRouter();

export const render = async (pathname, query) => {
  router.start(pathname, query);
  const data = (await router.target?.ssr({ pathname, query })) ?? {};
  return {
    head: "",
    html: router.target({ pathname, query, data }),
    __INITIAL_DATA__: data,
  };
};
