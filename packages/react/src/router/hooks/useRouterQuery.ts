import { useRouter } from "@hanghae-plus/lib";
import { router } from "../router";

export const useRouterQuery = () => {
  if (typeof window === "undefined") {
    return {};
  }

  return useRouter(router, ({ query }) => query);
};
