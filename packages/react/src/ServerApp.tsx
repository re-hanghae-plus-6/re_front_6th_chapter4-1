import { ModalProvider, ToastProvider } from "./components";
import { ServerRouterProvider } from "./router/ServerRouterContext";

interface ServerAppProps {
  PageComponent: React.ComponentType;
  query: Record<string, string>;
  pathname: string;
}

/**
 * 서버 사이드 렌더링용 App 컴포넌트
 */
export const ServerApp = ({ PageComponent, query, pathname }: ServerAppProps) => {
  return (
    <ServerRouterProvider query={query} pathname={pathname}>
      <ToastProvider>
        <ModalProvider>
          <PageComponent />
        </ModalProvider>
      </ToastProvider>
    </ServerRouterProvider>
  );
};
