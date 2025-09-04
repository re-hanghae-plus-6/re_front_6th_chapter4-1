import { renderToString } from "react-dom/server";
import { Providers } from "./core/providers";
import { createProductStore, initialProductState } from "./entities";
import type { GlobalSnapshot } from "./global";
import * as Home from "./pages/home/page";
import * as ProductDetail from "./pages/product/detail.page";
import { safeSerialize } from "./utils/safeSerialize";
import { NotFoundPage } from "./pages/not-found";

export const render = async (url: string): Promise<{ head: string; html: string; initialDataScript: string }> => {
  const router = await import("./core/router/instance").then((module) => module.router);

  router
    .addRoute("/", Home.PageComponent, {
      getServerSideProps: Home.getServerSideProps,
      generateMetaData: Home.generateMetaData,
    })
    .addRoute("/product/:id/", ProductDetail.PageComponent, {
      getServerSideProps: ProductDetail.getServerSideProps,
      generateMetaData: ProductDetail.generateMetaData,
    })
    .addRoute(".*", NotFoundPage);

  const context = router.createContext(url);
  const initialSnapshots = { snapshots: { productStore: initialProductState } } satisfies GlobalSnapshot;

  if (!context || !context.handler) {
    return {
      html: renderToString(<NotFoundPage />),
      head: /* html */ `<title>쇼핑몰 - 404</title>`,
      initialDataScript: wrappingInitialDataScript(initialSnapshots),
    };
  }

  const prefetchedData = ((await router.prefetch(url)) ?? initialSnapshots) as GlobalSnapshot;
  const generatedMetadata = await router.generateMetaData(url);

  return {
    html: renderToString(
      <Providers router={router} productStore={createProductStore(prefetchedData.snapshots.productStore)}>
        <context.handler {...prefetchedData} />
      </Providers>,
    ),
    head: /* html */ `${generatedMetadata?.metadata.title ? `<title>${generatedMetadata.metadata.title}</title>` : ""}`,
    initialDataScript: wrappingInitialDataScript(prefetchedData),
  };
};

const wrappingInitialDataScript = (initialDataScript = {}) => {
  return /* html */ `<script>window.__INITIAL_DATA__=${safeSerialize(initialDataScript)}</script>`;
};
