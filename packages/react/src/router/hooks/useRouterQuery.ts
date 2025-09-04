import { useRouter } from "@hanghae-plus/lib";
import { router } from "../router";
import type { StringRecord } from "../../types";

export const useRouterQuery = () => {
  return useRouter(router, ({ query }) => query as unknown as StringRecord);
};
