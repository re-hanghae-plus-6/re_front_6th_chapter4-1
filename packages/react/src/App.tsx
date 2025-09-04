import type { ComponentType } from "react";
import { useCurrentPage } from "./hooks";

/**
 * 전체 애플리케이션 렌더링
 */
type Props = {
  isPrefetched: boolean;
};
export const App = ({ isPrefetched }: Props) => {
  const PageComponent = useCurrentPage() as unknown as ComponentType<{ isPrefetched: boolean }>;

  return PageComponent ? <PageComponent isPrefetched={isPrefetched} /> : null;
};
