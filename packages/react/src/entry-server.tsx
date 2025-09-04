import { renderToString } from "react-dom/server";
import { Providers } from "./core/providers";
import { createProductStore } from "./entities";
import type { GlobalInitialData } from "./global";
import * as Home from "./pages/home/page";
import { NotFoundPage } from "./pages/not-found";
import * as ProductDetail from "./pages/product/detail.page";
import { safeSerialize } from "./utils/safeSerialize";

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
  const initialPrefetchedData = {
    initialData: {
      products: [],
      categories: {},
      totalCount: 0,
      loading: false,
      error: null,
      currentProduct: null,
      relatedProducts: [],
      status: "idle",
      query: router.query,
    },
  } satisfies GlobalInitialData;

  if (!context || !context.handler) {
    return {
      html: renderToString(<NotFoundPage />),
      head: /* html */ `<title>쇼핑몰 - 404</title>`,
      initialDataScript: wrappingInitialDataScript(initialPrefetchedData),
    };
  }

  const prefetchedData = ((await router.prefetch(url)) ?? initialPrefetchedData) as GlobalInitialData;
  const generatedMetadata = await router.generateMetaData(url);

  return {
    html: renderToString(
      <Providers
        router={router}
        productStore={createProductStore({
          products: prefetchedData.initialData.products,
          totalCount: prefetchedData.initialData.totalCount,

          currentProduct: prefetchedData.initialData.currentProduct,
          relatedProducts: prefetchedData.initialData.relatedProducts,

          loading: prefetchedData.initialData.loading,
          error: prefetchedData.initialData.error,
          status: prefetchedData.initialData.status,

          categories: prefetchedData.initialData.categories,
        })}
      >
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
