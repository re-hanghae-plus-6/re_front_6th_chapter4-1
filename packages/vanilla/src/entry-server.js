import { safeSerialize } from "./utils";

import { HomePage, renderHomePageForServer, getServerSideProps as getHomePageServerSideProps } from "./pages/index";
import { NotFoundPage } from "./pages/not-found";
import {
  ProductDetailPage,
  renderProductDetailPageForServer,
  getServerSideProps as getProductDetailPageServerSideProps,
} from "./pages/product/[id]";

function renderHead(title = "쇼핑몰 - 홈") {
  return `<title>${title}</title>`;
}

const notFound = () => {
  throw new Error("notFound");
};

export const render = async (url) => {
  const router = await import("./router/router").then((module) => module.router);
  router.addRoute("/", HomePage);
  router.addRoute("/product/:id/", ProductDetailPage);
  router.addRoute(".*", NotFoundPage);

  const context = router.resolve(url);

  let head = "";
  let html = "";
  let initialDataScript = "";

  try {
    if (context.path === " .*" || context.path === undefined) {
      throw notFound();
    }

    if (context.path === "/") {
      const { initialData } = await getHomePageServerSideProps(context);

      head = renderHead("쇼핑몰 - 홈");
      html = renderHomePageForServer(initialData);
      initialDataScript = wrappingInitialDataScript(initialData);
    } else if (context.path === "/product/:id/") {
      const { id } = context.params || {};

      if (!id) {
        throw notFound();
      }

      const { initialData } = await getProductDetailPageServerSideProps(context);

      head = renderHead(`${initialData.currentProduct.title} - 쇼핑몰`);
      html = renderProductDetailPageForServer(initialData);
      initialDataScript = wrappingInitialDataScript(initialData);
    }
  } catch (error) {
    head = renderHead("쇼핑몰 - 404");
    html = ``;
    initialDataScript = wrappingInitialDataScript({ status: error.message ?? "notFound" });
  }

  return {
    head,
    html,
    initialDataScript,
  };
};

const wrappingInitialDataScript = (initialData = {}) => {
  return `<script>window.__INITIAL_DATA__ = ${safeSerialize(initialData)};</script>`;
};
