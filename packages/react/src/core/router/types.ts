/**
 * 라우터 관련 공통 타입 정의
 */

import type { ComponentType } from "react";

export type RouteHandler<T extends object = object> = ComponentType<T>;

export interface GetServerSidePropsContext {
  params: Record<string, string>;
  query: Record<string, string>;
  url: string;
}

export interface GetServerSidePropsResult<T = Record<string, unknown>> {
  props: T;
}

export interface GenerateMetaDataResult {
  metadata: Partial<{
    title: string;
    description: string;
    image: string;
  }>;
}

export interface GetServerSideProps<T = Record<string, unknown>> {
  (context: GetServerSidePropsContext): Promise<GetServerSidePropsResult<T>> | GetServerSidePropsResult<T>;
}

export interface GenerateMetaData {
  (context: GetServerSidePropsContext): Promise<GenerateMetaDataResult> | GenerateMetaDataResult;
}

export interface RouteInfo {
  regex: RegExp;
  paramNames: string[];
  handler: RouteHandler;
  getServerSideProps?: GetServerSideProps;
  generateMetaData?: GenerateMetaData;
}

export interface MatchedRoute extends RouteInfo {
  params: Record<string, string>;
  path: string;
}

export interface ServerMatchedRoute extends MatchedRoute {
  query: Record<string, string>;
}

export interface RouterInstance {
  baseUrl: string;
  route: MatchedRoute | null;
  params: Record<string, string>;
  target: RouteHandler | undefined;
  query: Record<string, string>;
  addRoute(
    path: string,
    handler: RouteHandler,
    options?: { getServerSideProps?: GetServerSideProps; generateMetaData?: GenerateMetaData },
  ): void;
}

export interface ClientRouterInstance extends RouterInstance {
  subscribe(fn: () => void): () => void;
  push(url: string): void;
  start(): void;
}

export interface ServerRouterInstance {
  baseUrl: string;
  route: ServerMatchedRoute | null;
  params: Record<string, string>;
  target: RouteHandler | undefined;
  query: Record<string, string>;
  addRoute(
    path: string,
    handler: RouteHandler,
    options?: { getServerSideProps?: GetServerSideProps; generateMetaData?: GenerateMetaData },
  ): void;
  match(url: string): ServerMatchedRoute | null;
  createContext(url: string): ServerMatchedRoute | null;
  prefetch(url: string): Promise<Record<string, unknown> | null>;
  generateMetaData(url: string): Promise<GenerateMetaDataResult | null>;
}
