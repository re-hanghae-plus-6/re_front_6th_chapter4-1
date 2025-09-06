import { createStores, setupProductState } from "./stores";
import { NotFoundPage } from "./pages";
import { createRouter } from "./router";
import { App } from "./App";

export async function render(url) {
  try {
    const router = createRouter();
    const stores = createStores();
    router.push(url);
    router.query = { current: undefined };
    const PageComponent = router.target ?? NotFoundPage;
    const { head, ...initialData } = await PageComponent.getServerProps({ router });

    setupProductState(stores.productStore, initialData);

    return {
      html: App({ stores, router }),
      head: head ?? `<title>쇼핑몰</title>`,
      initialData,
    };
  } catch (error) {
    console.error("SSR Error:", error);
    return {
      html: "<div>서버 렌더링 중 오류가 발생했습니다.</div>",
      head: "<title>오류 - 쇼핑몰</title>",
      initialData: null,
    };
  }
}
