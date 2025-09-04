import { router } from "../routes";
import { useRouter } from "@hanghae-plus/lib";

export const useCurrentPage = () => {
  return useRouter(router, ({ target }) => target);
};
