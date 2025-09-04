import { renderToString } from "react-dom/server";
import { ServerApp } from "./ServerApp";
import { PRODUCT_ACTIONS, productStore } from "./entities/products/productStore";
import { HomePage, NotFoundPage, ProductDetailPage } from "./pages";
import { RouterProvider } from "./router/RouterCountext";
import { ServerRouter } from "./router/ServerRouter";

export const render = async (url: string) => {
  const serverRouter = new ServerRouter();

  serverRouter.addRoute("/", HomePage);
  serverRouter.addRoute("/product/:id/", ProductDetailPage);
  serverRouter.addRoute(".*", NotFoundPage);

  serverRouter.start(url);

  const { pathname, query, params } = serverRouter;

  const routeParams = { pathname, query, params };
  const data = await serverRouter.prefetch(routeParams);

  // 서버에서 prefetch한 데이터를 store에 저장
  if (data && Object.keys(data).length > 0) {
    productStore.dispatch({
      type: PRODUCT_ACTIONS.SETUP,
      payload: data,
    });
  }

  const metaData = serverRouter.target?.meta ? serverRouter.target.meta(data) : "";
  const head = metaData;

  // 서버에서는 ServerApp을 사용하여 컴포넌트를 렌더링
  const PageComponent = serverRouter.target;

  const html = PageComponent
    ? renderToString(
        <RouterProvider router={serverRouter}>
          <ServerApp PageComponent={PageComponent} />
        </RouterProvider>,
      )
    : "";

  return { html, head, initialData: data };
};
