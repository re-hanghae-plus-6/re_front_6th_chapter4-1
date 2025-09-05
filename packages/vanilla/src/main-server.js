import { createRequestContextBase } from "./ssr/context.js";
import { ServerRouter } from "./lib/ServerRouter.js";
import { routes } from "./router/router.js";

export const render = async (pathname, query) => {
  const router = new ServerRouter(routes, createRequestContextBase);
  router.start(pathname);
  const params = { pathname, query, params: router.params };

  if (router.target?.ssr) {
    const result = await router.target(params);

    return {
      head: `<title>${result.metadata?.title ?? ""}</title>`,
      html: result.html,
      __INITIAL_DATA__: result.data ?? {},
    };
  }

  const metadata = await router.target?.metadata?.(params);
  return {
    head: `<title>${metadata?.title ?? ""}</title>`,
    html: router.target({ ...params, data: {} }),
    __INITIAL_DATA__: {},
  };
};
