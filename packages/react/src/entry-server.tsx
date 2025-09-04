import { renderToString } from "react-dom/server";
import { Providers } from "./core/providers";
import { createProductStore, initialProductState } from "./entities";
import type { GlobalSnapshot } from "./global";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { getHomePageProps, getProductDetailProps } from "./pages/serverSideProps";
import { safeSerialize } from "./utils/safeSerialize";

export const render = async (url: string): Promise<{ head: string; html: string; initialDataScript: string }> => {
  const router = await import("./router").then((module) => module.router);

  router.addRoute("/", HomePage, getHomePageProps);
  router.addRoute("/product/:id/", ProductDetailPage, getProductDetailProps);
  router.addRoute(".*", NotFoundPage);

  const context = router.createContext(url);
  const initialSnapshots = { snapshots: { productStore: initialProductState } } satisfies GlobalSnapshot;

  if (!context || !context.handler) {
    return {
      html: renderToString(<NotFoundPage />),
      head: "",
      initialDataScript: wrappingInitialDataScript(initialSnapshots),
    };
  }

  const prefetchedData = ((await router.prefetch(url)) ?? initialSnapshots) as GlobalSnapshot;

  return {
    html: renderToString(
      <Providers router={router} productStore={createProductStore(prefetchedData.snapshots.productStore)}>
        <context.handler {...prefetchedData} />
      </Providers>,
    ),
    head: "",
    initialDataScript: wrappingInitialDataScript(prefetchedData),
  };
};

const wrappingInitialDataScript = (initialDataScript = {}) => {
  return /* html */ `<script>window.__INITIAL_DATA__=${safeSerialize(initialDataScript)}</script>`;
};
