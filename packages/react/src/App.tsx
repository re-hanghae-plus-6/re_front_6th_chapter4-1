import { router, useCurrentPage, registerClientRoutes } from "./router";
import { useLoadCartStore } from "./entities";
import { ModalProvider, ToastProvider } from "./components";
import { isClient } from "./utils/runtime";
import { getGlobalSSRData } from "./main";

// 클라이언트에서만 라우트 등록
if (isClient) {
  registerClientRoutes(router);
}

const CartInitializer = () => {
  useLoadCartStore();
  return null;
};

/**
 * 전체 애플리케이션 렌더링
 */
export const App = () => {
  const PageComponent = useCurrentPage();

  // 클라이언트에서 전역 SSR 데이터 확인
  const ssrData = isClient ? getGlobalSSRData() : null;

  console.log("🔍 App.tsx - 전역 SSR 데이터 상태:", {
    hasSSRData: !!ssrData,
    productsCount: ssrData?.products?.length || 0,
    categoriesCount: Object.keys(ssrData?.categories || {}).length,
  });

  return (
    <>
      <ToastProvider>
        <ModalProvider>
          {PageComponent ? (
            <PageComponent
              ssrData={
                ssrData
                  ? {
                      products: ssrData.products || [],
                      categories: ssrData.categories || {},
                      totalCount: ssrData.totalCount || 0,
                    }
                  : undefined
              }
              ssrQuery={ssrData?.__SSR_QUERY__}
            />
          ) : null}
        </ModalProvider>
      </ToastProvider>
      <CartInitializer />
    </>
  );
};
