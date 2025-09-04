import { useRouter } from "@hanghae-plus/lib";
import { router } from "../routes";

export const useRouterQuery = () => {
  return useRouter(router, ({ query }) => query);
};
