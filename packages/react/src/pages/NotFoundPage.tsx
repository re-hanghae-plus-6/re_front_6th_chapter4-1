import { PageWrapper } from "./PageWrapper";
import { Logo, PublicImage } from "../components";
import type { SSRPageComponent, MetaData } from "../types/ssr";

const NotFoundPageComponent: SSRPageComponent = () => (
  <PageWrapper headerLeft={<Logo />}>
    <div className="text-center my-4 py-20 shadow-md p-6 bg-white rounded-lg">
      <PublicImage src="/404.svg" alt="페이지를 찾을 수 없습니다" />

      <a
        href="/"
        data-link="/"
        className="inline-block px-6 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        홈으로
      </a>
    </div>
  </PageWrapper>
);

// NotFoundPage는 SSR 데이터가 필요하지 않음
NotFoundPageComponent.ssr = async () => {
  // 404 페이지는 정적이므로 빈 객체 반환
  return {};
};

// 404 페이지 메타데이터
NotFoundPageComponent.metadata = (): MetaData => ({
  title: "404 - 페이지를 찾을 수 없습니다 | 쇼핑몰",
  description: "요청하신 페이지를 찾을 수 없습니다. 홈페이지로 돌아가서 다른 상품을 둘러보세요.",
  keywords: "404, 페이지 없음, 쇼핑몰",
});

export const NotFoundPage = NotFoundPageComponent;
