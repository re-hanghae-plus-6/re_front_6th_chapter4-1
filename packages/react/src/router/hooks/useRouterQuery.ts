import { useRouter } from "@hanghae-plus/lib";
import { router } from "../router";
import { useQueryContext } from "../../contexts/QueryContext";

export const useRouterQuery = () => {
  // SSR에서는 Context 사용
  if (typeof window === "undefined") {
    try {
      return useQueryContext().query;
    } catch {
      return {};
    }
  }

  // 클라이언트에서는 라우터 사용
  return useRouter(router, ({ query }) => query);
};

// export const useProductFilter = () => {
//   const result = useRouter(router, ({ query }) => query);
//   return result ?? {};
// };
