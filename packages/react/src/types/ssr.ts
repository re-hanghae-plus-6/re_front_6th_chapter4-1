import type { ComponentType } from "react";

/**
 * SSR 컨텍스트 - 서버에서 페이지 렌더링 시 전달되는 정보
 */
export interface SSRContext {
  /** 라우트 파라미터 (예: { id: "123" }) */
  params: Record<string, string>;
  /** 쿼리 파라미터 (예: { search: "keyword", page: "1" }) */
  query: Record<string, string>;
}

/**
 * 메타데이터 정보
 */
export interface MetaData {
  title: string;
  description: string;
  keywords?: string;
  image?: string;
  url?: string;
}

/**
 * SSR 지원 페이지 컴포넌트 타입
 * React 컴포넌트에 SSR 메서드들을 추가한 확장 타입
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SSRPageComponent<T = any> = ComponentType<T> & {
  /**
   * 서버에서 데이터 프리페칭을 위한 메서드
   * @param context SSR 컨텍스트 (params, query)
   * @returns 프리페칭된 데이터
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ssr?: (context: SSRContext) => Promise<any>;

  /**
   * 메타데이터 생성을 위한 메서드
   * @param data SSR에서 프리페칭된 데이터
   * @returns 메타데이터 객체
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: (data?: any) => Promise<MetaData> | MetaData;
};

/**
 * 라우트 정보
 */
export interface RouteInfo {
  /** 라우트 패턴 (예: "/product/:id/") */
  path: string;
  /** 라우트 핸들러 (React 컴포넌트) */
  handler: SSRPageComponent;
  /** 라우트 파라미터 이름들 */
  paramNames: string[];
  /** 라우트 매칭을 위한 정규식 */
  regex: RegExp;
  /** 매칭된 파라미터들 */
  params?: Record<string, string>;
}

/**
 * 서버 렌더링 결과
 */
export interface SSRResult {
  /** HTML head 섹션 내용 */
  head: string;
  /** 렌더링된 HTML 내용 */
  html: string;
  /** 클라이언트로 전달할 초기 데이터 */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __INITIAL_DATA__: any;
}

/**
 * 라우트 매칭 설정
 */
export interface RouteConfig {
  /** 라우트 경로 패턴 */
  path: string;
  /** React 컴포넌트 */
  component: SSRPageComponent;
  /** 라우트 이름 (디버깅용) */
  name: string;
}
