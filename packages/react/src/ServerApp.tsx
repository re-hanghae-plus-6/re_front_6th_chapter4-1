import { ModalProvider, ToastProvider } from "./components";

interface ServerAppProps {
  PageComponent: React.ComponentType;
}

/**
 * 서버 사이드 렌더링용 App 컴포넌트
 */
export const ServerApp = ({ PageComponent }: ServerAppProps) => {
  return (
    <>
      <ToastProvider>
        <ModalProvider>
          <PageComponent />
        </ModalProvider>
      </ToastProvider>
    </>
  );
};
