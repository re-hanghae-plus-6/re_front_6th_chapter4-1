import { router } from "../router";
import { useRouter } from "@hanghae-plus/lib";

type Params = Record<string, string | undefined>;

const defaultSelector = <S>(params: Params) => params as S;

export const useRouterParams = <S>(selector = defaultSelector<S>) => {
  return useRouter(router, ({ params }) => selector((params ?? {}) as Params));
};
