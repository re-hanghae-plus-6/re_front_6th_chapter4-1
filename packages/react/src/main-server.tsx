import { Router } from "@hanghae-plus/lib";
import { renderToString } from "react-dom/server";
import { App } from "./App";
import { routes } from "./router";
import { RouterProvider } from "./router/RouterContext";
import type { ServerOptions } from "./router/withServer";

const fallback = () => {};

export const render = async (url: string, query: Record<string, string>) => {
  console.log({ url, query });
  const router = new Router(routes);
  router.start(url);
  router.query = query;
  const { ssr = fallback, metadata = fallback } = router.target as unknown as ServerOptions;
  const params = { query, params: router.params };
  const { title = "" } = (await metadata(params)) ?? {};
  const data = (await ssr(params)) ?? {};
  const html = renderToString(
    <RouterProvider router={router}>
      <App data={data} />
    </RouterProvider>,
  );

  return {
    head: `<title>${title}</title>`,
    html,
    __INITIAL_DATA__: data,
  };
};
