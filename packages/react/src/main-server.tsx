import { Router } from "@hanghae-plus/lib";
import { BASE_URL } from "./constants";
import { routes } from "./router";
import { renderToString } from "react-dom/server";
import { App } from "./App";
import { createProductStore } from "./entities";
import { ProductProvider } from "./entities/products/context/ProductContext";
import { RouterProvider } from "./router/RouterContext";

type SSRParams = {
  pathname: string;
  query: Record<string, string>;
  params: Record<string, string>;
};

type SSRComponent = {
  ssr?: (params: SSRParams) => Promise<unknown>;
  metadata?: (params: SSRParams) => Promise<{ title?: string }>;
  (params: SSRParams & { data: Record<string, unknown> }): string;
};

export const render = async (pathname: string, query: Record<string, string>) => {
  const router = new Router(routes, BASE_URL);
  router.start(pathname);
  router.query = query;
  const params = { pathname, query, params: router.params };

  const target = router.target as unknown as SSRComponent;

  if (target?.ssr) {
    const result = await target.ssr(params);

    return {
      head: `<title>${(await target.metadata?.(params))?.title ?? ""}</title>`,
      html: renderToString(
        <RouterProvider router={router}>
          <ProductProvider productStore={createProductStore(result ?? {})}>
            <App />
          </ProductProvider>
        </RouterProvider>,
      ),
      __INITIAL_DATA__: result,
    };
  }

  const metadata = await target?.metadata?.(params);
  return {
    head: `<title>${metadata?.title ?? ""}</title>`,
    html: target({ ...params, data: {} }),
    __INITIAL_DATA__: {},
  };
};
