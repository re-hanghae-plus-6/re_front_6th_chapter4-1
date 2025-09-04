import { renderToString } from "react-dom/server";
import { App } from "./App";
import { router } from "./router";
import type { ServerOptions } from "./router/withServer";

const fallback = () => {};

export const render = async (url: string, query: Record<string, string>) => {
  console.log({ url, query });
  console.log("server start");
  router.start(url);
  const { ssr = fallback, metadata = fallback } = router.target as unknown as ServerOptions;
  const params = { query, params: router.params };
  const { title = "" } = (await metadata(params)) ?? {};
  const data = (await ssr(params)) ?? {};
  const html = renderToString(<App data={data} query={query} />);
  console.log("server end");

  return {
    head: `<title>${title}</title>`,
    html,
    __INITIAL_DATA__: data,
  };
};
