import { RouterContext, StoreContext } from "./contexts";
import { NotFoundPage } from "./pages";
import { callOnce } from "./utils/callOnce";
import { useAllEvents } from "./events";
import { useCartService } from "./services";
import { isServer } from "./utils/index.js";

const setup = callOnce(() => {
  if (isServer()) {
    return;
  }
  const cartService = useCartService();
  useAllEvents();
  cartService.loadCartFromStorage();
});

export const App = ({ stores, router }) =>
  StoreContext.Provider(stores, () =>
    RouterContext.Provider(router, () => {
      setup();
      const PageComponent = router.target || NotFoundPage;
      return PageComponent();
    }),
  );
